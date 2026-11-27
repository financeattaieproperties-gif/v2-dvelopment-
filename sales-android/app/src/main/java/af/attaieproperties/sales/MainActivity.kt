package af.attaieproperties.sales

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import androidx.webkit.WebViewAssetLoader
import java.io.File

/**
 * Dedicated Android Activity for the Attaie Properties Sales Agent Workspace (/sales).
 *
 * - Loads the compiled Sales Agent bundle from app/src/main/assets/www/index.html via HTTPS WebViewAssetLoader
 * - Connects to the exact same backend (/staff-api/v1/...) with persistent session & CSRF cookies
 * - Bridges tel: and WhatsApp links to the native Android dialer
 * - Supports camera/gallery file uploads for Buyer 3x4 Portrait & Tazkira photos when closing a deal
 * - Handles hardware Back navigation across Sales CRM tabs (Leads, Follow-ups, Customers, Projects, Overview)
 */
class ServerConfigBridge(private val activity: AppCompatActivity) {
    companion object {
        private const val PREFS_NAME = "attaie_sales_v2_testing_server_prefs"
        private const val KEY_API_BASE_URL = "staff_api_base_url"
    }

    @JavascriptInterface
    fun getApiBaseUrl(): String {
        val prefs = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE)
        val saved = prefs.getString(KEY_API_BASE_URL, null)?.trim()
        return if (!saved.isNullOrEmpty()) saved else BuildConfig.STAFF_API_BASE_URL
    }

    @JavascriptInterface
    fun setApiBaseUrl(url: String?): Boolean {
        val cleaned = url?.trim().orEmpty()
        if (!cleaned.startsWith("https://") && !cleaned.startsWith("http://")) {
            return false
        }
        val prefs = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE)
        prefs.edit().putString(KEY_API_BASE_URL, cleaned).apply()
        return true
    }
}

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var batteryBridge: DeviceBatteryBridge
    private lateinit var serverConfigBridge: ServerConfigBridge
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var pendingCameraUri: Uri? = null
    private var pendingChooserParams: WebChromeClient.FileChooserParams? = null

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
        val params = pendingChooserParams
        pendingChooserParams = null
        if (params != null) {
            launchFileChooserIntent(params)
        } else {
            filePathCallback?.onReceiveValue(null)
            filePathCallback = null
        }
    }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = filePathCallback ?: return@registerForActivityResult
        filePathCallback = null
        val capturedUri = pendingCameraUri
        pendingCameraUri = null

        if (result.resultCode == Activity.RESULT_OK) {
            val dataUri = result.data?.data
            val clipData = result.data?.clipData
            val uris = when {
                clipData != null -> Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                dataUri != null -> arrayOf(dataUri)
                capturedUri != null -> arrayOf(capturedUri)
                else -> null
            }
            callback.onReceiveValue(uris)
        } else {
            callback.onReceiveValue(null)
        }
    }

    private fun launchFileChooserIntent(fileChooserParams: WebChromeClient.FileChooserParams): Boolean {
        return try {
            val contentIntent = fileChooserParams.createIntent()
            val cameraIntent = createCameraCaptureIntent()
            val launchIntent = if (cameraIntent != null) {
                Intent.createChooser(contentIntent, getString(R.string.app_name)).apply {
                    putExtra(Intent.EXTRA_INITIAL_INTENTS, arrayOf(cameraIntent))
                }
            } else {
                contentIntent
            }
            fileChooserLauncher.launch(launchIntent)
            true
        } catch (_: Exception) {
            pendingCameraUri = null
            this.filePathCallback?.onReceiveValue(null)
            this.filePathCallback = null
            false
        }
    }

    private fun createCameraCaptureIntent(): Intent? {
        val hasCamera = packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)
        if (!hasCamera) return null
        val hasCameraPerm = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.CAMERA
        ) == PackageManager.PERMISSION_GRANTED
        if (!hasCameraPerm) return null

        val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (captureIntent.resolveActivity(packageManager) == null) return null

        return try {
            val capturesDir = File(cacheDir, "captures").apply { mkdirs() }
            val photoFile = File.createTempFile("buyer_doc_", ".jpg", capturesDir)
            val uri = FileProvider.getUriForFile(
                this,
                "${BuildConfig.APPLICATION_ID}.fileprovider",
                photoFile
            )
            pendingCameraUri = uri
            captureIntent.putExtra(MediaStore.EXTRA_OUTPUT, uri)
            captureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            captureIntent
        } catch (_: Exception) {
            pendingCameraUri = null
            null
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        swipeRefresh = SwipeRefreshLayout(this).apply {
            setColorSchemeColors(0xFF0F172A.toInt())
            setProgressBackgroundColorSchemeColor(0xFFFFFFFF.toInt())
        }
        webView = WebView(this)
        val biometricBridge = BiometricAuthBridge(this, webView)
        batteryBridge = DeviceBatteryBridge(applicationContext, webView)
        serverConfigBridge = ServerConfigBridge(this)
        webView.addJavascriptInterface(biometricBridge, "AttaieBiometric")
        webView.addJavascriptInterface(batteryBridge, "AttaieBattery")
        webView.addJavascriptInterface(serverConfigBridge, "AttaieServerConfig")
        swipeRefresh.addView(webView)
        setContentView(swipeRefresh)

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("website.attaieproperties.com")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        cookieManager.setAcceptThirdPartyCookies(webView, true)

        val defaultUserAgent = WebSettings.getDefaultUserAgent(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            userAgentString = "$defaultUserAgent AttaieSalesAndroid/2.0"
        }

        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val reqUrl = request.url
                var response = assetLoader.shouldInterceptRequest(reqUrl)
                if (
                    response == null &&
                    reqUrl.host == "website.attaieproperties.com" &&
                    (reqUrl.path == "/login-logo.png" || reqUrl.path == "/logo.png")
                ) {
                    val mappedUri = Uri.parse("https://website.attaieproperties.com/assets/www/logo.png")
                    response = assetLoader.shouldInterceptRequest(mappedUri)
                }
                if (response == null) return null
                val headers = response.responseHeaders ?: mutableMapOf()
                headers["Access-Control-Allow-Origin"] = "*"
                headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
                response.responseHeaders = headers
                return response
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                Log.e("SalesWebView", "Resource error for ${request?.url}: ${error?.description} (${error?.errorCode})")
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val url = request.url.toString()
                // Open tel:, mailto:, and WhatsApp links in native Android apps
                if (
                    url.startsWith("tel:") ||
                    url.startsWith("mailto:") ||
                    url.startsWith("whatsapp:") ||
                    url.contains("wa.me/")
                ) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, request.url))
                    } catch (_: ActivityNotFoundException) {
                        // Ignore gracefully if target app is unavailable
                    }
                    return true
                }
                return false
            }

            override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                cookieManager.flush()
                val apiBase = serverConfigBridge.getApiBaseUrl()
                view.evaluateJavascript(
                    "window.__ATTAIE_ANDROID_APP__ = true; window.__ATTAIE_STAFF_API_BASE_URL__ = ${org.json.JSONObject.quote(apiBase)};",
                    null
                )
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false
                cookieManager.flush()
                // Ensure the shared backend URL and native runtime flag are injected for API and biometric calls
                val apiBase = serverConfigBridge.getApiBaseUrl()
                view.evaluateJavascript(
                    "window.__ATTAIE_ANDROID_APP__ = true; window.__ATTAIE_STAFF_API_BASE_URL__ = ${org.json.JSONObject.quote(apiBase)};",
                    null
                )
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                consoleMessage?.let {
                    Log.d("SalesWebViewConsole", "${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                }
                return true
            }

            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                this@MainActivity.filePathCallback?.onReceiveValue(null)
                this@MainActivity.filePathCallback = filePathCallback
                pendingCameraUri = null

                val hasCamera = packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)
                val hasCameraPerm = ContextCompat.checkSelfPermission(
                    this@MainActivity,
                    Manifest.permission.CAMERA
                ) == PackageManager.PERMISSION_GRANTED

                if (hasCamera && !hasCameraPerm) {
                    pendingChooserParams = fileChooserParams
                    cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
                    return true
                }

                return launchFileChooserIntent(fileChooserParams)
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // Load the bundled Sales Agent Workspace over virtual HTTPS origin
        webView.loadUrl("https://website.attaieproperties.com/assets/www/index.html")
    }

    override fun onResume() {
        super.onResume()
        if (::batteryBridge.isInitialized) {
            batteryBridge.startObserving()
        }
    }

    override fun onPause() {
        super.onPause()
        if (::batteryBridge.isInitialized) {
            batteryBridge.stopObserving()
        }
        CookieManager.getInstance().flush()
    }
}
