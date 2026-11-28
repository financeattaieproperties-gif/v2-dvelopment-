package com.attaieproperties.v2

import android.content.Intent
import android.content.res.Configuration
import android.net.Uri
import android.os.Bundle
import android.util.Patterns
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.Apartment
import androidx.compose.material.icons.rounded.Bathtub
import androidx.compose.material.icons.rounded.Bed
import androidx.compose.material.icons.rounded.Business
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.CloudUpload
import androidx.compose.material.icons.rounded.Dashboard
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Email
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.FavoriteBorder
import androidx.compose.material.icons.rounded.HelpOutline
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material.icons.rounded.LocationOn
import androidx.compose.material.icons.rounded.Lock
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Phone
import androidx.compose.material.icons.rounded.PhotoCamera
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Security
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.SquareFoot
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material.icons.rounded.VerifiedUser
import androidx.compose.material.icons.rounded.Visibility
import androidx.compose.material.icons.rounded.VisibilityOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * =============================================================================
 * ATTAIE PROPERTIES V2 — 24-SCREEN ANDROID APP (JETPACK COMPOSE / MATERIAL 3)
 * =============================================================================
 * Production Integration Notes:
 * 1. Place your unmodified `Logo.png` at `app/src/main/res/drawable/attaie_logo.png`.
 * 2. Create `AttaieAppViewModel` via `ViewModelProvider` / `viewModel(factory = AttaieAppViewModel.factory(repo))`
 *    in your `ComponentActivity` so state survives configuration changes.
 * 3. Implement `AttaieRepository` against your real backend API (Retrofit/Ktor/Supabase).
 *    The default `UnconfiguredAttaieRepository` fails closed and never simulates auth success.
 * 4. For remote property photography, swap `PropertyImageFrame` to Coil's `AsyncImage(model = imageUrl)`.
 * =============================================================================
 */

// =============================================================================
// 1. OFFICIAL BRAND PALETTE & MATERIAL 3 THEME (WCAG AA CONTRAST SAFE)
// =============================================================================

object BrandPalette {
    // Official brand hues for icons, borders, and non-text accents
    val Blue = Color(0xFF298FCE)
    val BlueSoft = Color(0xFFEAF4FB)
    val Green = Color(0xFF19A64F)
    val GreenSoft = Color(0xFFE8F7EE)
    val Gray = Color(0xFF545454) // >= 7.4:1 on white

    // WCAG 2.1 AA (>= 4.5:1) darkened brand tones for normal-size white text & text-on-white
    val BlueAccessible = Color(0xFF186A9C)   // 5.8:1 contrast with white
    val GreenAccessible = Color(0xFF117838)  // 5.5:1 contrast with white

    val Ink = Color(0xFF171A1F)
    val CanvasLight = Color(0xFFF6F8FA)
    val SurfaceLight = Color(0xFFFFFFFF)
    val BorderLight = Color(0xFFE4E8EE)

    val SurfaceDark = Color(0xFF0E1217)
    val CanvasDark = Color(0xFF161C24)
    val BorderDark = Color(0xFF262F3A)

    val Danger = Color(0xFFB71C1C)
    val DangerSoft = Color(0xFFFDECEC)
}

private val AttaieTypography = Typography(
    headlineLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 34.sp,
        letterSpacing = (-0.6).sp
    ),
    headlineMedium = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 23.sp,
        lineHeight = 29.sp,
        letterSpacing = (-0.4).sp
    ),
    titleLarge = TextStyle(
        fontWeight = FontWeight.Bold,
        fontSize = 19.sp,
        lineHeight = 25.sp,
        letterSpacing = (-0.3).sp
    ),
    titleMedium = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp,
        letterSpacing = (-0.2).sp
    ),
    titleSmall = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = (-0.1).sp
    ),
    bodyLarge = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 22.sp
    ),
    bodyMedium = TextStyle(
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 20.sp
    ),
    labelLarge = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        letterSpacing = 0.1.sp
    ),
    labelSmall = TextStyle(
        fontWeight = FontWeight.SemiBold,
        fontSize = 11.sp,
        letterSpacing = 0.4.sp
    )
)

private val LightColors = lightColorScheme(
    primary = BrandPalette.BlueAccessible,
    onPrimary = Color.White,
    secondary = BrandPalette.GreenAccessible,
    onSecondary = Color.White,
    background = BrandPalette.CanvasLight,
    onBackground = BrandPalette.Ink,
    surface = BrandPalette.SurfaceLight,
    onSurface = BrandPalette.Ink,
    surfaceVariant = Color(0xFFEDF1F5),
    onSurfaceVariant = BrandPalette.Gray,
    outline = BrandPalette.BorderLight,
    error = BrandPalette.Danger
)

private val DarkColors = darkColorScheme(
    primary = BrandPalette.Blue,
    onPrimary = Color.White,
    secondary = BrandPalette.Green,
    onSecondary = Color.White,
    background = BrandPalette.SurfaceDark,
    onBackground = Color(0xFFF3F4F6),
    surface = BrandPalette.CanvasDark,
    onSurface = Color(0xFFF3F4F6),
    surfaceVariant = Color(0xFF202730),
    onSurfaceVariant = Color(0xFFB7C0CC),
    outline = BrandPalette.BorderDark,
    error = Color(0xFFEF5350)
)

@Composable
fun AttaieV2Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = AttaieTypography,
        content = content
    )
}

// =============================================================================
// 2. BILINGUAL HELPER (ENGLISH LTR + AFGHAN DARI RTL)
// =============================================================================

enum class AppLang(val label: String, val isRtl: Boolean) {
    ENGLISH("English", false),
    DARI("دری (AF)", true)
}

fun tr(lang: AppLang, en: String, da: String): String = if (lang == AppLang.DARI) da else en

private fun localizedCategoryLabel(lang: AppLang, canonical: String): String = when (canonical) {
    "All" -> tr(lang, "All", "همه")
    "Villa" -> tr(lang, "Villa", "ویلا")
    "Apartment" -> tr(lang, "Apartment", "اپارتمان")
    "House" -> tr(lang, "House", "خانه")
    "Commercial" -> tr(lang, "Commercial", "تجارتی")
    else -> canonical
}

// =============================================================================
// 3. NON-CYCLIC NAVIGATION ENUMS (FIXES K02: ZERO CIRCULAR STATIC INIT)
// =============================================================================

enum class BottomTab(val icon: ImageVector, val en: String, val da: String) {
    HOME(Icons.Rounded.Home, "Home", "خانه"),
    SEARCH(Icons.Rounded.Search, "Search", "جستجو"),
    SAVED(Icons.Rounded.FavoriteBorder, "Saved", "ذخیره"),
    DASHBOARD(Icons.Rounded.Dashboard, "Dashboard", "داشبورد"),
    PROFILE(Icons.Rounded.Person, "Profile", "پروفایل")
}

enum class AttaieRoute(val screenNumber: String, val requiresAuth: Boolean = false) {
    WELCOME("01"),
    LOGIN("02"),
    CREATE_ACCOUNT("03"),
    VERIFICATION("04"),
    ACCOUNT_TYPE("05", requiresAuth = true),
    HOME("06"),
    SEARCH("07"),
    SEARCH_RESULTS("08"),
    ADVANCED_FILTERS("09"),
    PROPERTY_DETAILS("10"),
    SAVED("11"),
    DASHBOARD("12", requiresAuth = true),
    MY_PROPERTIES("13", requiresAuth = true),
    ADD_EDIT_PROPERTY("14", requiresAuth = true),
    LISTING_REVIEW_STATUS("15", requiresAuth = true),
    AGENCY_REGISTRATION("16", requiresAuth = true),
    AGENCY_CONTACTS("17", requiresAuth = true),
    AGENCY_DOCUMENTS("18", requiresAuth = true),
    AGENCY_STATUS("19", requiresAuth = true),
    AGENCY_CORRECTION("20", requiresAuth = true),
    INQUIRIES("21", requiresAuth = true),
    INQUIRY_DETAILS("22", requiresAuth = true),
    NOTIFICATIONS("23", requiresAuth = true),
    PROFILE("24")
}

/** One-way computed mapping from BottomTab -> AttaieRoute (safe regardless of class init order). */
fun BottomTab.destinationRoute(): AttaieRoute = when (this) {
    BottomTab.HOME -> AttaieRoute.HOME
    BottomTab.SEARCH -> AttaieRoute.SEARCH
    BottomTab.SAVED -> AttaieRoute.SAVED
    BottomTab.DASHBOARD -> AttaieRoute.DASHBOARD
    BottomTab.PROFILE -> AttaieRoute.PROFILE
}

/** One-way computed mapping from AttaieRoute -> active BottomTab (null hides bottom bar). */
fun AttaieRoute.selectedBottomTab(): BottomTab? = when (this) {
    AttaieRoute.HOME, AttaieRoute.NOTIFICATIONS -> BottomTab.HOME
    AttaieRoute.SEARCH, AttaieRoute.SEARCH_RESULTS -> BottomTab.SEARCH
    AttaieRoute.SAVED -> BottomTab.SAVED
    AttaieRoute.DASHBOARD, AttaieRoute.MY_PROPERTIES, AttaieRoute.INQUIRIES -> BottomTab.DASHBOARD
    AttaieRoute.PROFILE -> BottomTab.PROFILE
    else -> null
}

// =============================================================================
// 4. DOMAIN MODELS & REPOSITORY CONTRACT (STRICT PUBLIC vs OWNER SEPARATION)
// =============================================================================

enum class AccountType { INDIVIDUAL, AGENCY }

enum class DealType(val en: String, val da: String) {
    BUY("For Sale", "برای فروش"),
    RENT("For Rent", "برای کرایه")
}

enum class ListingStatus(val en: String, val da: String) {
    DRAFT("Draft", "پیش‌نویس"),
    PENDING("Pending", "در بررسی"),
    PUBLISHED("Published", "منتشرشده"),
    REJECTED("Rejected", "ردشده"),
    SOLD("Sold", "فروخته‌شده"),
    RENTED("Rented", "کرایه‌داده‌شده")
}

enum class AgencyStatus(val en: String, val da: String) {
    DRAFT("Draft", "پیش‌نویس"),
    PENDING_REVIEW("Pending Review", "در انتظار بررسی"),
    APPROVED("Approved", "تاییدشده"),
    REJECTED("Rejected", "ردشده")
}

enum class SortOption(val en: String, val da: String) {
    NEWEST("Newest", "جدیدترین"),
    PRICE_ASC("Price: Low to High", "قیمت: کم به زیاد"),
    PRICE_DESC("Price: High to Low", "قیمت: زیاد به کم"),
    AREA_DESC("Largest Area", "بیشترین مساحت")
}

enum class UploadState { IDLE, UPLOADING, UPLOADED, FAILED }
enum class ListingFormMode { CREATE, EDIT, RESUBMIT }

data class AuthSession(
    val userId: String,
    val sessionToken: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val accountType: AccountType,
    val isVerified: Boolean
)

data class PropertyListing(
    val id: String,
    val ownerId: String,
    val titleEn: String,
    val titleDa: String,
    val districtEn: String,
    val districtDa: String,
    val cityEn: String,
    val cityDa: String,
    val dealType: DealType,
    val priceUsd: Int,
    val priceDisplay: String,
    val categoryEn: String,
    val categoryDa: String,
    val beds: Int,
    val baths: Int,
    val areaSqm: Int,
    val floorNumber: Int,
    val floorInfoEn: String,
    val floorInfoDa: String,
    val mapXFraction: Float,
    val mapYFraction: Float,
    val status: ListingStatus,
    val imageUrls: List<String> = emptyList(),
    val descriptionEn: String,
    val descriptionDa: String,
    val amenitiesEn: List<String>,
    val amenitiesDa: List<String>,
    val sellerLabelEn: String,
    val sellerLabelDa: String,
    val sellerVerified: Boolean = false,
    val submittedDate: String = "Nov 24, 2026",
    val rejectionNoteEn: String? = null,
    val rejectionNoteDa: String? = null
)

data class PropertyInquiry(
    val id: String,
    val propertyId: String,
    val ownerId: String,
    val customerLabelEn: String,
    val customerLabelDa: String,
    val dateLabel: String,
    val messageEn: String,
    val messageDa: String,
    val unread: Boolean,
    val statusEn: String,
    val statusDa: String
)

data class AppNotification(
    val id: String,
    val titleEn: String,
    val titleDa: String,
    val bodyEn: String,
    val bodyDa: String,
    val timeLabel: String,
    val unread: Boolean,
    val targetRoute: AttaieRoute,
    val targetRecordId: String? = null
)

data class FilterState(
    val dealType: DealType? = null,
    val city: String = "",
    val district: String = "",
    val minPrice: String = "",
    val maxPrice: String = "",
    val category: String = "All",
    val minBeds: Int = 0,
    val minBaths: Int = 0,
    val minArea: String = "",
    val floor: String = ""
)

data class LoginFormState(
    val identifier: String = "",
    val password: String = "",
    val passwordVisible: Boolean = false,
    val rememberMe: Boolean = true,
    val identifierError: String? = null,
    val passwordError: String? = null,
    val formError: String? = null
)

data class RegisterFormState(
    val fullName: String = "",
    val email: String = "",
    val phone: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val passwordVisible: Boolean = false,
    val confirmVisible: Boolean = false,
    val agreedToTerms: Boolean = false,
    val error: String? = null
)

data class VerificationFormState(
    val isOtpMode: Boolean = true,
    val destinationLabel: String = "",
    val otpCode: String = "",
    val error: String? = null,
    val verified: Boolean = false
)

data class ListingDraft(
    val mode: ListingFormMode = ListingFormMode.CREATE,
    val editingListingId: String? = null,
    val step: Int = 1,
    val title: String = "",
    val dealType: DealType = DealType.BUY,
    val category: String = "Villa",
    val description: String = "",
    val city: String = "Kabul",
    val district: String = "",
    val priceUsd: String = "",
    val areaSqm: String = "",
    val beds: String = "3",
    val baths: String = "2",
    val floor: String = "1",
    val attachedPhotoUris: List<String> = emptyList(),
    val validationError: String? = null
)

data class AgencyRevisionEntry(
    val version: Int,
    val dateLabel: String,
    val status: AgencyStatus,
    val noteEn: String,
    val noteDa: String
)

data class AgencyApplication(
    val businessName: String = "",
    val registrationNo: String = "",
    val businessAddress: String = "",
    val representativeName: String = "",
    val businessDetails: String = "",
    val businessEmail: String = "",
    val businessPhone: String = "",
    val ownerVerifiedContact: String = "",
    val registrationDocName: String = "",
    val registrationUploadState: UploadState = UploadState.IDLE,
    val registrationUploadProgress: Float = 0f,
    val licenseDocName: String = "",
    val licenseUploadState: UploadState = UploadState.IDLE,
    val licenseUploadProgress: Float = 0f,
    val status: AgencyStatus = AgencyStatus.DRAFT,
    val validationError: String? = null,
    val rejectionReasonEn: String = "",
    val rejectionReasonDa: String = "",
    val history: List<AgencyRevisionEntry> = emptyList()
) {
    val isAnyUploadInProgress: Boolean
        get() = registrationUploadState == UploadState.UPLOADING || licenseUploadState == UploadState.UPLOADING

    val areRequiredDocsUploaded: Boolean
        get() = registrationUploadState == UploadState.UPLOADED && licenseUploadState == UploadState.UPLOADED
}

/**
 * Production backend repository contract.
 * Public catalog and authorized owner records are strictly separated.
 */
interface AttaieRepository {
    suspend fun fetchPublicListings(): Result<List<PropertyListing>>
    suspend fun fetchOwnerListings(ownerId: String): Result<List<PropertyListing>>
    suspend fun fetchOwnerInquiries(ownerId: String): Result<List<PropertyInquiry>>
    suspend fun fetchNotifications(ownerId: String): Result<List<AppNotification>>
    suspend fun signIn(identifier: String, password: String, rememberMe: Boolean): Result<AuthSession>
    suspend fun createAccount(form: RegisterFormState): Result<AuthSession>
    suspend fun verifyAccount(userId: String, code: String, isOtp: Boolean): Result<AuthSession>
    suspend fun resendVerification(userId: String, isOtp: Boolean): Result<Unit>
    suspend fun requestPasswordReset(identifier: String): Result<Unit>
    suspend fun signOut(sessionToken: String): Result<Unit>
    suspend fun saveDraftListing(ownerId: String, draft: ListingDraft): Result<PropertyListing>
    suspend fun submitListingForReview(ownerId: String, draft: ListingDraft): Result<PropertyListing>
    suspend fun uploadAgencyDocument(ownerId: String, fileName: String, onProgress: (Float) -> Unit): Result<String>
    suspend fun submitAgencyApplication(ownerId: String, app: AgencyApplication): Result<AgencyApplication>
    suspend fun refreshAgencyStatus(ownerId: String): Result<AgencyApplication>
    suspend fun sendBuyerInquiry(propertyId: String, senderName: String, senderPhone: String, message: String): Result<Unit>
    suspend fun replyToInquiry(inquiryId: String, replyMessage: String): Result<Unit>
}

/**
 * Fail-closed production default so authentication and mutations NEVER fake success
 * when a real backend implementation has not yet been injected.
 */
class UnconfiguredAttaieRepository : AttaieRepository {
    private fun fail(service: String) = Result.failure<Nothing>(
        IllegalStateException("$service backend is not configured. Inject your production AttaieRepository.")
    )

    override suspend fun fetchPublicListings(): Result<List<PropertyListing>> = fail("Public catalog")
    override suspend fun fetchOwnerListings(ownerId: String): Result<List<PropertyListing>> = fail("Owner listings")
    override suspend fun fetchOwnerInquiries(ownerId: String): Result<List<PropertyInquiry>> = fail("Inquiries")
    override suspend fun fetchNotifications(ownerId: String): Result<List<AppNotification>> = fail("Notifications")
    override suspend fun signIn(identifier: String, password: String, rememberMe: Boolean): Result<AuthSession> = fail("Authentication")
    override suspend fun createAccount(form: RegisterFormState): Result<AuthSession> = fail("Registration")
    override suspend fun verifyAccount(userId: String, code: String, isOtp: Boolean): Result<AuthSession> = fail("Verification")
    override suspend fun resendVerification(userId: String, isOtp: Boolean): Result<Unit> = fail("Verification resend")
    override suspend fun requestPasswordReset(identifier: String): Result<Unit> = fail("Password recovery")
    override suspend fun signOut(sessionToken: String): Result<Unit> = Result.success(Unit)
    override suspend fun saveDraftListing(ownerId: String, draft: ListingDraft): Result<PropertyListing> = fail("Draft storage")
    override suspend fun submitListingForReview(ownerId: String, draft: ListingDraft): Result<PropertyListing> = fail("Listing submission")
    override suspend fun uploadAgencyDocument(ownerId: String, fileName: String, onProgress: (Float) -> Unit): Result<String> = fail("Document upload")
    override suspend fun submitAgencyApplication(ownerId: String, app: AgencyApplication): Result<AgencyApplication> = fail("Agency submission")
    override suspend fun refreshAgencyStatus(ownerId: String): Result<AgencyApplication> = fail("Agency status")
    override suspend fun sendBuyerInquiry(propertyId: String, senderName: String, senderPhone: String, message: String): Result<Unit> = fail("Buyer inquiry")
    override suspend fun replyToInquiry(inquiryId: String, replyMessage: String): Result<Unit> = fail("Inquiry reply")
}

/**
 * Internal sample repository strictly scoped for `@Preview` composables.
 * Even in previews, `signIn` / `createAccount` / `verifyAccount` fail closed.
 */
internal class PreviewAttaieRepository : AttaieRepository {
    private val publicCatalog = listOf(
        PropertyListing(
            id = "pub-1",
            ownerId = "agency-1",
            titleEn = "Modern Courtyard Villa (Sample)",
            titleDa = "ویلای عصری با حویلی وسیع (نمونه)",
            districtEn = "Wazir Akbar Khan, District 10",
            districtDa = "وزیر اکبر خان، ناحیه ۱۰",
            cityEn = "Kabul",
            cityDa = "کابل",
            dealType = DealType.BUY,
            priceUsd = 420000,
            priceDisplay = "$420,000",
            categoryEn = "Villa",
            categoryDa = "ویلا",
            beds = 5,
            baths = 4,
            areaSqm = 480,
            floorNumber = 2,
            floorInfoEn = "2 Floors + Basement",
            floorInfoDa = "۲ منزل + ته‌کوی",
            mapXFraction = 0.58f,
            mapYFraction = 0.30f,
            status = ListingStatus.PUBLISHED,
            descriptionEn = "Fictional sample listing: Contemporary limestone and glass residence with sunlit courtyard and solar backup.",
            descriptionDa = "ملکیت نمونه: حویلی عصری با نمای سنگ و شیشه، حویلی آفتاب‌گیر و برق سولری.",
            amenitiesEn = listOf("Central Heating", "Solar Backup", "2-Car Garage", "Guest Suite"),
            amenitiesDa = listOf("مرکزگرمی", "برق سولری", "گراج ۲ موتر", "مهمان‌خانه"),
            sellerLabelEn = "Sample Agency A • Kabul",
            sellerLabelDa = "رهنمای معاملات نمونه • کابل",
            sellerVerified = true
        ),
        PropertyListing(
            id = "pub-2",
            ownerId = "owner-2",
            titleEn = "Shahr-e-Naw Residence Apartment (Sample)",
            titleDa = "اپارتمان رهایشی شهر نو (نمونه)",
            districtEn = "Shahr-e-Naw, District 4",
            districtDa = "شهر نو، ناحیه ۴",
            cityEn = "Kabul",
            cityDa = "کابل",
            dealType = DealType.RENT,
            priceUsd = 1150,
            priceDisplay = "$1,150 / mo",
            categoryEn = "Apartment",
            categoryDa = "اپارتمان",
            beds = 3,
            baths = 2,
            areaSqm = 185,
            floorNumber = 6,
            floorInfoEn = "Floor 6 of 9",
            floorInfoDa = "منزل ۶ از ۹",
            mapXFraction = 0.25f,
            mapYFraction = 0.52f,
            status = ListingStatus.PUBLISHED,
            descriptionEn = "Fictional sample listing: Bright 3-bedroom apartment overlooking Shahr-e-Naw Park with elevator access.",
            descriptionDa = "ملکیت نمونه: اپارتمان روشن ۳ اطاقه مشرف به پارک شهر نو دارای لفت.",
            amenitiesEn = listOf("Elevator", "Park View", "Underground Parking"),
            amenitiesDa = listOf("لفت", "دید پارک", "پارکینگ زیرزمینی"),
            sellerLabelEn = "Sample Owner Account",
            sellerLabelDa = "حساب مالک نمونه",
            sellerVerified = false
        )
    )

    private val ownerRecords = listOf(
        PropertyListing(
            id = "own-1",
            ownerId = "preview-user",
            titleEn = "Kart-e-Char Townhouse (Sample)",
            titleDa = "خانه عصری کارته چهار (نمونه)",
            districtEn = "Kart-e-Char, District 3",
            districtDa = "کارته چهار، ناحیه ۳",
            cityEn = "Kabul",
            cityDa = "کابل",
            dealType = DealType.BUY,
            priceUsd = 265000,
            priceDisplay = "$265,000",
            categoryEn = "House",
            categoryDa = "خانه",
            beds = 4,
            baths = 3,
            areaSqm = 320,
            floorNumber = 3,
            floorInfoEn = "3 Levels",
            floorInfoDa = "۳ طبقه",
            mapXFraction = 0.30f,
            mapYFraction = 0.65f,
            status = ListingStatus.DRAFT,
            descriptionEn = "Fictional sample draft: Architectural family townhouse with rooftop terrace.",
            descriptionDa = "پیش‌نویس نمونه: خانه فامیلی با تراس بام.",
            amenitiesEn = listOf("Roof Terrace", "Private Courtyard"),
            amenitiesDa = listOf("تراس بام", "حویلی مستقل"),
            sellerLabelEn = "Preview Owner",
            sellerLabelDa = "مالک پیش‌نمایش"
        ),
        PropertyListing(
            id = "own-2",
            ownerId = "preview-user",
            titleEn = "Taimani Office Floor (Sample)",
            titleDa = "منزل دفتری تایمنی (نمونه)",
            districtEn = "Taimani, District 4",
            districtDa = "تایمنی، ناحیه ۴",
            cityEn = "Kabul",
            cityDa = "کابل",
            dealType = DealType.RENT,
            priceUsd = 2400,
            priceDisplay = "$2,400 / mo",
            categoryEn = "Commercial",
            categoryDa = "تجارتی",
            beds = 0,
            baths = 2,
            areaSqm = 290,
            floorNumber = 3,
            floorInfoEn = "Floor 3 of 6",
            floorInfoDa = "منزل ۳ از ۶",
            mapXFraction = 0.65f,
            mapYFraction = 0.60f,
            status = ListingStatus.REJECTED,
            descriptionEn = "Fictional sample listing awaiting revision.",
            descriptionDa = "ملکیت نمونه نیازمند اصلاح.",
            amenitiesEn = listOf("Elevator", "Backup Generator"),
            amenitiesDa = listOf("لفت", "جنراتور"),
            sellerLabelEn = "Preview Owner",
            sellerLabelDa = "مالک پیش‌نمایش",
            rejectionNoteEn = "Interior photos are missing and district street reference requires clarification.",
            rejectionNoteDa = "تصاویر داخل ملکیت ناقص است و مشخصات سرک ناحیه نیاز به توضیح بیشتر دارد."
        )
    )

    override suspend fun fetchPublicListings(): Result<List<PropertyListing>> = Result.success(publicCatalog)
    override suspend fun fetchOwnerListings(ownerId: String): Result<List<PropertyListing>> = Result.success(ownerRecords.filter { it.ownerId == ownerId })
    override suspend fun fetchOwnerInquiries(ownerId: String): Result<List<PropertyInquiry>> = Result.success(
        listOf(
            PropertyInquiry(
                id = "inq-1",
                propertyId = "own-1",
                ownerId = ownerId,
                customerLabelEn = "Sample Customer A",
                customerLabelDa = "مشتری نمونه اول",
                dateLabel = "Today • 14:20",
                messageEn = "Sample inquiry preview: Is this property available for an inspection this week?",
                messageDa = "پیش‌نمایش پیام: آیا امکان بازدید حضوری از این ملکیت در هفته جاری وجود دارد؟",
                unread = true,
                statusEn = "New",
                statusDa = "جدید"
            )
        )
    )
    override suspend fun fetchNotifications(ownerId: String): Result<List<AppNotification>> = Result.success(
        listOf(
            AppNotification(
                id = "n1",
                titleEn = "Property Review Decision",
                titleDa = "نتیجه بررسی اعلان ملکیت",
                bodyEn = "Taimani Office Floor (Sample) requires updates before publication.",
                bodyDa = "اعلان منزل دفتری تایمنی (نمونه) پیش از نشر نیاز به اصلاح دارد.",
                timeLabel = "Yesterday",
                unread = true,
                targetRoute = AttaieRoute.LISTING_REVIEW_STATUS,
                targetRecordId = "own-2"
            )
        )
    )
    override suspend fun signIn(identifier: String, password: String, rememberMe: Boolean): Result<AuthSession> =
        Result.failure(IllegalStateException("Preview repository cannot authenticate."))
    override suspend fun createAccount(form: RegisterFormState): Result<AuthSession> =
        Result.failure(IllegalStateException("Preview repository cannot register accounts."))
    override suspend fun verifyAccount(userId: String, code: String, isOtp: Boolean): Result<AuthSession> =
        Result.failure(IllegalStateException("Preview repository cannot verify codes."))
    override suspend fun resendVerification(userId: String, isOtp: Boolean): Result<Unit> =
        Result.failure(IllegalStateException("Preview repository cannot send verification codes."))
    override suspend fun requestPasswordReset(identifier: String): Result<Unit> =
        Result.failure(IllegalStateException("Preview repository cannot send reset links."))
    override suspend fun signOut(sessionToken: String): Result<Unit> = Result.success(Unit)
    override suspend fun saveDraftListing(ownerId: String, draft: ListingDraft): Result<PropertyListing> =
        Result.success(buildListingFromDraft(ownerId, draft, ListingStatus.DRAFT))
    override suspend fun submitListingForReview(ownerId: String, draft: ListingDraft): Result<PropertyListing> =
        Result.success(buildListingFromDraft(ownerId, draft, ListingStatus.PENDING))
    override suspend fun uploadAgencyDocument(ownerId: String, fileName: String, onProgress: (Float) -> Unit): Result<String> {
        for (i in 1..4) { delay(120); onProgress(i / 4f) }
        return Result.success(fileName)
    }
    override suspend fun submitAgencyApplication(ownerId: String, app: AgencyApplication): Result<AgencyApplication> =
        Result.success(app.copy(status = AgencyStatus.PENDING_REVIEW))
    override suspend fun refreshAgencyStatus(ownerId: String): Result<AgencyApplication> =
        Result.success(AgencyApplication(status = AgencyStatus.PENDING_REVIEW))
    override suspend fun sendBuyerInquiry(propertyId: String, senderName: String, senderPhone: String, message: String): Result<Unit> =
        Result.success(Unit)
    override suspend fun replyToInquiry(inquiryId: String, replyMessage: String): Result<Unit> =
        Result.success(Unit)

    private fun buildListingFromDraft(ownerId: String, d: ListingDraft, status: ListingStatus): PropertyListing {
        val price = d.priceUsd.filter { it.isDigit() }.toIntOrNull() ?: 0
        return PropertyListing(
            id = d.editingListingId ?: "own-${System.currentTimeMillis()}",
            ownerId = ownerId,
            titleEn = d.title.ifBlank { "Untitled Draft" },
            titleDa = d.title.ifBlank { "پیش‌نویس بدون عنوان" },
            districtEn = d.district.ifBlank { "Unspecified District" },
            districtDa = d.district.ifBlank { "ناحیه مشخص‌نشده" },
            cityEn = d.city.ifBlank { "Kabul" },
            cityDa = d.city.ifBlank { "کابل" },
            dealType = d.dealType,
            priceUsd = price,
            priceDisplay = if (d.dealType == DealType.RENT) "$$price / mo" else "$$price",
            categoryEn = d.category,
            categoryDa = d.category,
            beds = d.beds.toIntOrNull() ?: 0,
            baths = d.baths.toIntOrNull() ?: 1,
            areaSqm = d.areaSqm.toIntOrNull() ?: 0,
            floorNumber = d.floor.toIntOrNull() ?: 1,
            floorInfoEn = "Floor ${d.floor}",
            floorInfoDa = "منزل ${d.floor}",
            mapXFraction = 0.5f,
            mapYFraction = 0.5f,
            status = status,
            imageUrls = d.attachedPhotoUris,
            descriptionEn = d.description,
            descriptionDa = d.description,
            amenitiesEn = emptyList(),
            amenitiesDa = emptyList(),
            sellerLabelEn = "Preview Owner",
            sellerLabelDa = "مالک پیش‌نمایش"
        )
    }
}

// =============================================================================
// 5. APPLICATION STATE & LIFECYCLE-OWNED VIEWMODEL (PER-OPERATION LOADING)
// =============================================================================

data class AttaieAppState(
    val language: AppLang = AppLang.ENGLISH,
    val route: AttaieRoute = AttaieRoute.WELCOME,
    val backStack: List<AttaieRoute> = emptyList(),
    // Session & identity (server-owned)
    val session: AuthSession? = null,
    // Per-operation loading & error states (fixes K08)
    val isAuthLoading: Boolean = false,
    val isCatalogLoading: Boolean = false,
    val catalogError: String? = null,
    val isOwnerDataLoading: Boolean = false,
    val isSubmittingListing: Boolean = false,
    val isSubmittingAgency: Boolean = false,
    val isSendingInquiry: Boolean = false,
    // Preferences
    val notificationsEnabled: Boolean = true,
    // Forms preserved in ViewModel
    val loginForm: LoginFormState = LoginFormState(),
    val registerForm: RegisterFormState = RegisterFormState(),
    val verificationForm: VerificationFormState = VerificationFormState(),
    // Search & Filters (applied vs draft)
    val searchQuery: String = "",
    val recentSearches: List<String> = emptyList(),
    val homeDealFilter: DealType = DealType.BUY,
    val appliedFilters: FilterState = FilterState(),
    val draftFilters: FilterState = FilterState(),
    val filterRangeError: String? = null,
    val sortOption: SortOption = SortOption.NEWEST,
    // Strictly separated public vs owner datasets (fixes K04)
    val publicListings: List<PropertyListing> = emptyList(),
    val ownerListings: List<PropertyListing> = emptyList(),
    val savedIds: Set<String> = emptySet(),
    val selectedPropertyId: String? = null,
    val selectedMapPropertyId: String? = null,
    val selectedReviewListingId: String? = null,
    val myPropertiesTab: ListingStatus? = null,
    val draft: ListingDraft = ListingDraft(),
    val agencyApp: AgencyApplication = AgencyApplication(),
    val inquiries: List<PropertyInquiry> = emptyList(),
    val selectedInquiryId: String? = null,
    val notifications: List<AppNotification> = emptyList(),
    val resultsListMode: Boolean = true
) {
    val isAuthenticated: Boolean get() = session != null
}

class AttaieAppViewModel(
    private val repository: AttaieRepository = UnconfiguredAttaieRepository(),
    initialSession: AuthSession? = null
) : ViewModel() {

    private val _state = MutableStateFlow(AttaieAppState(session = initialSession))
    val state: StateFlow<AttaieAppState> = _state.asStateFlow()

    private val _snackbar = MutableSharedFlow<String>(extraBufferCapacity = 4)
    val snackbar: SharedFlow<String> = _snackbar.asSharedFlow()

    init {
        refreshPublicCatalog()
        if (initialSession != null) {
            refreshOwnerWorkspace(initialSession.userId)
        }
    }

    companion object {
        fun factory(repository: AttaieRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return AttaieAppViewModel(repository) as T
                }
            }
    }

    fun refreshPublicCatalog() {
        viewModelScope.launch {
            _state.update { it.copy(isCatalogLoading = true, catalogError = null) }
            try {
                repository.fetchPublicListings().fold(
                    onSuccess = { list ->
                        val publishedOnly = list.filter { it.status == ListingStatus.PUBLISHED }
                        _state.update {
                            it.copy(
                                publicListings = publishedOnly,
                                selectedMapPropertyId = it.selectedMapPropertyId ?: publishedOnly.firstOrNull()?.id
                            )
                        }
                    },
                    onFailure = { err ->
                        _state.update { it.copy(catalogError = err.message ?: "Unable to load properties.") }
                    }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                _state.update { it.copy(catalogError = e.message ?: "Network error while loading properties.") }
            } finally {
                _state.update { it.copy(isCatalogLoading = false) }
            }
        }
    }

    fun refreshOwnerWorkspace(ownerId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isOwnerDataLoading = true) }
            try {
                repository.fetchOwnerListings(ownerId).onSuccess { list ->
                    _state.update { it.copy(ownerListings = list.filter { p -> p.ownerId == ownerId }) }
                }
                repository.fetchOwnerInquiries(ownerId).onSuccess { list ->
                    _state.update { it.copy(inquiries = list.filter { i -> i.ownerId == ownerId }) }
                }
                repository.fetchNotifications(ownerId).onSuccess { list ->
                    _state.update { it.copy(notifications = list) }
                }
            } catch (ce: CancellationException) {
                throw ce
            } catch (_: Exception) {
                emitMessage(tr(_state.value.language, "Some account data could not be loaded.", "بخشی از معلومات حساب بارگذاری نشد."))
            } finally {
                _state.update { it.copy(isOwnerDataLoading = false) }
            }
        }
    }

    fun navigate(target: AttaieRoute, clearBackStack: Boolean = false) {
        _state.update { s ->
            if (s.route == target) return@update s
            val updatedStack = if (clearBackStack) emptyList() else (s.backStack + s.route).takeLast(20)
            s.copy(route = target, backStack = updatedStack)
        }
    }

    fun selectBottomTab(tab: BottomTab) {
        val target = tab.destinationRoute()
        _state.update { s ->
            if (s.route == target) s
            else s.copy(route = target, backStack = if (target == AttaieRoute.HOME) emptyList() else listOf(AttaieRoute.HOME))
        }
    }

    fun navigateBack() {
        _state.update { s ->
            val prev = s.backStack.lastOrNull() ?: return@update s
            s.copy(route = prev, backStack = s.backStack.dropLast(1))
        }
    }

    fun toggleLanguage() {
        _state.update { s ->
            s.copy(language = if (s.language == AppLang.ENGLISH) AppLang.DARI else AppLang.ENGLISH)
        }
    }

    fun emitMessage(msg: String) {
        _snackbar.tryEmit(msg)
    }

    // --- Authentication, Registration, Verification & Full Logout Cleanup (K03) ---

    fun updateLoginForm(transform: (LoginFormState) -> LoginFormState) =
        _state.update { it.copy(loginForm = transform(it.loginForm)) }

    fun performLogin() {
        val s = _state.value
        if (s.isAuthLoading) return
        val lang = s.language
        val id = s.loginForm.identifier.trim()
        val pwd = s.loginForm.password

        val idError = if (!isValidEmailOrPhone(id)) tr(lang, "Enter a valid email or phone number.", "ایمیل یا شماره تماس معتبر وارد کنید.") else null
        val pwdError = if (pwd.length < 8) tr(lang, "Password must be at least 8 characters.", "رمز عبور باید حداقل ۸ حرف باشد.") else null
        if (idError != null || pwdError != null) {
            _state.update { it.copy(loginForm = it.loginForm.copy(identifierError = idError, passwordError = pwdError, formError = null)) }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isAuthLoading = true, loginForm = it.loginForm.copy(formError = null)) }
            try {
                repository.signIn(id, pwd, s.loginForm.rememberMe).fold(
                    onSuccess = { session ->
                        _state.update {
                            it.copy(
                                session = session,
                                loginForm = LoginFormState(),
                                agencyApp = it.agencyApp.copy(ownerVerifiedContact = "${session.email} • ${session.phone}")
                            )
                        }
                        refreshOwnerWorkspace(session.userId)
                        navigate(AttaieRoute.HOME, clearBackStack = true)
                    },
                    onFailure = { err ->
                        _state.update { it.copy(loginForm = it.loginForm.copy(formError = err.message ?: tr(lang, "Sign in failed.", "ورود ناموفق بود."))) }
                    }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                _state.update { it.copy(loginForm = it.loginForm.copy(formError = e.message ?: tr(lang, "Connection error.", "خطای اتصال."))) }
            } finally {
                _state.update { it.copy(isAuthLoading = false) }
            }
        }
    }

    fun requestPasswordRecovery() {
        val s = _state.value
        val id = s.loginForm.identifier.trim()
        if (!isValidEmailOrPhone(id)) {
            _state.update { it.copy(loginForm = it.loginForm.copy(identifierError = tr(s.language, "Enter your email or phone first.", "ابتدا ایمیل یا شماره تماس را وارد کنید."))) }
            return
        }
        viewModelScope.launch {
            try {
                repository.requestPasswordReset(id).fold(
                    onSuccess = { emitMessage(tr(s.language, "Recovery instructions sent.", "رهنمای بازیابی رمز عبور ارسال شد.")) },
                    onFailure = { err -> emitMessage(err.message ?: tr(s.language, "Recovery unavailable.", "بازیابی در دسترس نیست.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(s.language, "Recovery failed.", "بازیابی ناموفق بود."))
            }
        }
    }

    fun updateRegisterForm(transform: (RegisterFormState) -> RegisterFormState) =
        _state.update { it.copy(registerForm = transform(it.registerForm)) }

    fun submitCreateAccount() {
        val s = _state.value
        if (s.isAuthLoading) return
        val f = s.registerForm
        val lang = s.language
        val error = when {
            f.fullName.trim().length < 2 -> tr(lang, "Enter your full name.", "نام و تخلص خود را وارد کنید.")
            !isValidEmail(f.email.trim()) -> tr(lang, "Enter a valid email address.", "ایمیل معتبر وارد کنید.")
            !isValidPhone(f.phone.trim()) -> tr(lang, "Enter a valid phone number.", "شماره تماس معتبر وارد کنید.")
            f.password.length < 8 -> tr(lang, "Password must be at least 8 characters.", "رمز عبور باید حداقل ۸ حرف باشد.")
            f.password != f.confirmPassword -> tr(lang, "Passwords do not match.", "رمزهای عبور مطابقت ندارند.")
            !f.agreedToTerms -> tr(lang, "Accept Terms & Privacy Policy.", "با شرایط استفاده و حریم خصوصی موافقت کنید.")
            else -> null
        }
        if (error != null) {
            _state.update { it.copy(registerForm = it.registerForm.copy(error = error)) }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isAuthLoading = true, registerForm = it.registerForm.copy(error = null)) }
            try {
                repository.createAccount(f).fold(
                    onSuccess = { session ->
                        _state.update {
                            it.copy(
                                session = session,
                                verificationForm = VerificationFormState(destinationLabel = session.phone)
                            )
                        }
                        navigate(AttaieRoute.VERIFICATION)
                    },
                    onFailure = { err ->
                        _state.update { it.copy(registerForm = it.registerForm.copy(error = err.message ?: tr(lang, "Registration failed.", "ثبت نام ناموفق بود."))) }
                    }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                _state.update { it.copy(registerForm = it.registerForm.copy(error = e.message ?: tr(lang, "Connection error.", "خطای اتصال."))) }
            } finally {
                _state.update { it.copy(isAuthLoading = false) }
            }
        }
    }

    fun updateVerificationForm(transform: (VerificationFormState) -> VerificationFormState) =
        _state.update { it.copy(verificationForm = transform(it.verificationForm)) }

    fun submitVerification() {
        val s = _state.value
        if (s.isAuthLoading) return
        val vf = s.verificationForm
        val lang = s.language
        val userId = s.session?.userId
        if (userId == null) {
            _state.update { it.copy(verificationForm = it.verificationForm.copy(error = tr(lang, "No active registration session.", "جلسه ثبت نام فعال نیست."))) }
            return
        }
        if (vf.isOtpMode && vf.otpCode.length != 6) {
            _state.update { it.copy(verificationForm = it.verificationForm.copy(error = tr(lang, "Enter the 6-digit verification code.", "کود ۶ رقمی را کامل وارد کنید."))) }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isAuthLoading = true, verificationForm = it.verificationForm.copy(error = null)) }
            try {
                repository.verifyAccount(userId, vf.otpCode, vf.isOtpMode).fold(
                    onSuccess = { verifiedSession ->
                        _state.update { it.copy(session = verifiedSession, verificationForm = it.verificationForm.copy(verified = true)) }
                        navigate(AttaieRoute.ACCOUNT_TYPE)
                    },
                    onFailure = { err ->
                        _state.update { it.copy(verificationForm = it.verificationForm.copy(error = err.message ?: tr(lang, "Verification failed.", "تایید ناموفق بود."))) }
                    }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                _state.update { it.copy(verificationForm = it.verificationForm.copy(error = e.message ?: tr(lang, "Connection error.", "خطای اتصال."))) }
            } finally {
                _state.update { it.copy(isAuthLoading = false) }
            }
        }
    }

    fun resendVerificationCode() {
        val s = _state.value
        val userId = s.session?.userId ?: return
        viewModelScope.launch {
            try {
                repository.resendVerification(userId, s.verificationForm.isOtpMode).fold(
                    onSuccess = { emitMessage(tr(s.language, "Verification code sent.", "کود تایید ارسال شد.")) },
                    onFailure = { err -> emitMessage(err.message ?: tr(s.language, "Unable to resend.", "ارسال مجدد ممکن نیست.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(s.language, "Connection error.", "خطای اتصال."))
            }
        }
    }

    fun logout() {
        val token = _state.value.session?.sessionToken
        viewModelScope.launch {
            try {
                if (token != null) repository.signOut(token)
            } catch (ce: CancellationException) {
                throw ce
            } catch (_: Exception) {
                // Always clear local private state even if remote revoke fails
            } finally {
                _state.update { s ->
                    AttaieAppState(
                        language = s.language,
                        route = AttaieRoute.WELCOME,
                        publicListings = s.publicListings
                    )
                }
            }
        }
    }

    private fun isValidEmail(input: String): Boolean =
        Patterns.EMAIL_ADDRESS?.matcher(input)?.matches() ?: (input.contains("@") && input.contains("."))

    private fun isValidPhone(input: String): Boolean {
        val digits = input.filter { it.isDigit() }
        return digits.length in 9..15 && input.all { it.isDigit() || it in "+- ()" }
    }

    private fun isValidEmailOrPhone(input: String): Boolean =
        input.isNotBlank() && (isValidEmail(input) || isValidPhone(input))

    fun selectAccountType(type: AccountType) {
        _state.update { s -> s.copy(session = s.session?.copy(accountType = type)) }
    }

    // --- Public Exploration, Bilingual Token Search, Draft/Applied Filters & Sorting (K04, K05) ---

    fun toggleFavorite(propertyId: String) {
        _state.update { s ->
            val updated = if (propertyId in s.savedIds) s.savedIds - propertyId else s.savedIds + propertyId
            s.copy(savedIds = updated)
        }
    }

    fun openProperty(propertyId: String) {
        _state.update { it.copy(selectedPropertyId = propertyId, selectedMapPropertyId = propertyId) }
        navigate(AttaieRoute.PROPERTY_DETAILS)
    }

    fun selectMapProperty(propertyId: String) = _state.update { it.copy(selectedMapPropertyId = propertyId) }

    fun updateSearchQuery(q: String) = _state.update { it.copy(searchQuery = q) }

    fun commitSearch(query: String) {
        val cleaned = query.trim()
        _state.update { s ->
            val updatedRecent = if (cleaned.isNotBlank()) {
                (listOf(cleaned) + s.recentSearches.filterNot { it.equals(cleaned, ignoreCase = true) }).take(6)
            } else s.recentSearches
            s.copy(searchQuery = cleaned, recentSearches = updatedRecent)
        }
        navigate(AttaieRoute.SEARCH_RESULTS)
    }

    fun clearRecentSearches() = _state.update { it.copy(recentSearches = emptyList()) }

    fun setHomeDealFilter(deal: DealType) = _state.update { it.copy(homeDealFilter = deal) }

    fun openSeeAllFromHome() {
        val deal = _state.value.homeDealFilter
        _state.update { it.copy(appliedFilters = it.appliedFilters.copy(dealType = deal), draftFilters = it.appliedFilters.copy(dealType = deal)) }
        navigate(AttaieRoute.SEARCH_RESULTS)
    }

    fun openAdvancedFilters() {
        _state.update { it.copy(draftFilters = it.appliedFilters, filterRangeError = null) }
        navigate(AttaieRoute.ADVANCED_FILTERS)
    }

    fun updateDraftFilters(transform: (FilterState) -> FilterState) =
        _state.update { it.copy(draftFilters = transform(it.draftFilters), filterRangeError = null) }

    fun clearDraftFilters() =
        _state.update { it.copy(draftFilters = FilterState(), filterRangeError = null) }

    fun applyDraftFilters() {
        val s = _state.value
        val f = s.draftFilters
        val minP = f.minPrice.filter { it.isDigit() }.toIntOrNull()
        val maxP = f.maxPrice.filter { it.isDigit() }.toIntOrNull()
        if (minP != null && maxP != null && minP > maxP) {
            _state.update { it.copy(filterRangeError = tr(s.language, "Minimum price cannot exceed maximum price.", "حداقل قیمت نمی‌تواند از حداکثر قیمت بیشتر باشد.")) }
            return
        }
        _state.update { it.copy(appliedFilters = f, filterRangeError = null) }
        navigate(AttaieRoute.SEARCH_RESULTS)
    }

    fun clearAppliedFilters() =
        _state.update { it.copy(appliedFilters = FilterState(), draftFilters = FilterState(), searchQuery = "") }

    fun cycleSortOption() = _state.update { s ->
        val entries = SortOption.entries
        s.copy(sortOption = entries[(entries.indexOf(s.sortOption) + 1) % entries.size])
    }

    fun toggleResultsMode() = _state.update { it.copy(resultsListMode = !it.resultsListMode) }

    fun filteredAndSortedPublicListings(s: AttaieAppState = _state.value): List<PropertyListing> {
        val f = s.appliedFilters
        val tokens = s.searchQuery.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
        val minP = f.minPrice.filter { it.isDigit() }.toIntOrNull()
        val maxP = f.maxPrice.filter { it.isDigit() }.toIntOrNull()
        val minA = f.minArea.filter { it.isDigit() }.toIntOrNull()
        val floorNum = f.floor.filter { it.isDigit() }.toIntOrNull()

        val filtered = s.publicListings
            .filter { it.status == ListingStatus.PUBLISHED }
            .filter { p ->
                val searchable = listOf(
                    p.titleEn, p.titleDa, p.districtEn, p.districtDa,
                    p.cityEn, p.cityDa, p.categoryEn, p.categoryDa,
                    p.dealType.en, p.dealType.da
                ).joinToString(" ")
                val matchesQuery = tokens.isEmpty() || tokens.all { tok -> searchable.contains(tok, ignoreCase = true) }
                val matchesDeal = f.dealType == null || p.dealType == f.dealType
                val matchesCity = f.city.isBlank() || p.cityEn.contains(f.city, ignoreCase = true) || p.cityDa.contains(f.city, ignoreCase = true)
                val matchesDistrict = f.district.isBlank() || p.districtEn.contains(f.district, ignoreCase = true) || p.districtDa.contains(f.district, ignoreCase = true)
                val matchesCategory = f.category == "All" || p.categoryEn.equals(f.category, ignoreCase = true) || p.categoryDa.equals(f.category, ignoreCase = true)
                val matchesMinPrice = minP == null || p.priceUsd >= minP
                val matchesMaxPrice = maxP == null || p.priceUsd <= maxP
                val matchesBeds = p.beds >= f.minBeds
                val matchesBaths = p.baths >= f.minBaths
                val matchesArea = minA == null || p.areaSqm >= minA
                val matchesFloor = floorNum == null || p.floorNumber == floorNum
                matchesQuery && matchesDeal && matchesCity && matchesDistrict && matchesCategory &&
                    matchesMinPrice && matchesMaxPrice && matchesBeds && matchesBaths && matchesArea && matchesFloor
            }

        return when (s.sortOption) {
            SortOption.NEWEST -> filtered
            SortOption.PRICE_ASC -> filtered.sortedBy { it.priceUsd }
            SortOption.PRICE_DESC -> filtered.sortedByDescending { it.priceUsd }
            SortOption.AREA_DESC -> filtered.sortedByDescending { it.areaSqm }
        }
    }

    // --- Owner Listings, ID-Aware Editing & Durable Drafts (K06) ---

    fun setMyPropertiesTab(status: ListingStatus?) = _state.update { it.copy(myPropertiesTab = status) }

    fun markOwnerListingStatus(listingId: String, newStatus: ListingStatus) {
        val s = _state.value
        val ownerId = s.session?.userId ?: return
        _state.update { curr ->
            curr.copy(
                ownerListings = curr.ownerListings.map {
                    if (it.id == listingId && it.ownerId == ownerId) it.copy(status = newStatus) else it
                }
            )
        }
        emitMessage(tr(s.language, "Status updated to ${newStatus.en}.", "وضعیت به ${newStatus.da} تغییر یافت."))
    }

    fun openMyPropertiesWithStatus(status: ListingStatus?) {
        _state.update { it.copy(myPropertiesTab = status) }
        navigate(AttaieRoute.MY_PROPERTIES)
    }

    fun openListingReview(propertyId: String) {
        _state.update { it.copy(selectedReviewListingId = propertyId) }
        navigate(AttaieRoute.LISTING_REVIEW_STATUS)
    }

    fun startNewListing() {
        _state.update { it.copy(draft = ListingDraft(mode = ListingFormMode.CREATE)) }
        navigate(AttaieRoute.ADD_EDIT_PROPERTY)
    }

    fun startEditListing(listingId: String, isResubmit: Boolean = false) {
        val target = _state.value.ownerListings.find { it.id == listingId } ?: return
        _state.update {
            it.copy(
                draft = ListingDraft(
                    mode = if (isResubmit) ListingFormMode.RESUBMIT else ListingFormMode.EDIT,
                    editingListingId = target.id,
                    step = 1,
                    title = target.titleEn,
                    dealType = target.dealType,
                    category = target.categoryEn,
                    description = target.descriptionEn,
                    city = target.cityEn,
                    district = target.districtEn,
                    priceUsd = target.priceUsd.toString(),
                    areaSqm = target.areaSqm.toString(),
                    beds = target.beds.toString(),
                    baths = target.baths.toString(),
                    floor = target.floorNumber.toString(),
                    attachedPhotoUris = target.imageUrls
                )
            )
        }
        navigate(AttaieRoute.ADD_EDIT_PROPERTY)
    }

    fun updateDraft(transform: (ListingDraft) -> ListingDraft) =
        _state.update { it.copy(draft = transform(it.draft).copy(validationError = null)) }

    fun advanceDraftStep() {
        val s = _state.value
        val d = s.draft
        val lang = s.language
        val error = when (d.step) {
            1 -> if (d.title.trim().length < 4) tr(lang, "Enter a property title (at least 4 characters).", "عنوان ملکیت را وارد کنید (حداقل ۴ حرف).") else null
            2 -> if (d.city.isBlank() || d.district.isBlank()) tr(lang, "Enter both city and district.", "نام شهر و ناحیه را وارد کنید.") else null
            3 -> if ((d.priceUsd.filter { it.isDigit() }.toIntOrNull() ?: 0) <= 0) tr(lang, "Enter a valid asking price.", "قیمت معتبر وارد کنید.") else null
            else -> null
        }
        if (error != null) {
            _state.update { it.copy(draft = it.draft.copy(validationError = error)) }
        } else {
            _state.update { it.copy(draft = it.draft.copy(step = (it.draft.step + 1).coerceAtMost(6), validationError = null)) }
        }
    }

    fun saveListingDraft() {
        val s = _state.value
        val ownerId = s.session?.userId ?: return
        if (s.isSubmittingListing) return
        viewModelScope.launch {
            _state.update { it.copy(isSubmittingListing = true) }
            try {
                repository.saveDraftListing(ownerId, s.draft).fold(
                    onSuccess = { saved ->
                        _state.update { curr ->
                            val exists = curr.ownerListings.any { it.id == saved.id }
                            val updated = if (exists) curr.ownerListings.map { if (it.id == saved.id) saved else it } else listOf(saved) + curr.ownerListings
                            curr.copy(ownerListings = updated, draft = curr.draft.copy(editingListingId = saved.id))
                        }
                        emitMessage(tr(s.language, "Draft saved.", "پیش‌نویس ذخیره شد."))
                    },
                    onFailure = { err -> emitMessage(err.message ?: tr(s.language, "Failed to save draft.", "ذخیره پیش‌نویس ناموفق بود.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(s.language, "Connection error.", "خطای اتصال."))
            } finally {
                _state.update { it.copy(isSubmittingListing = false) }
            }
        }
    }

    fun submitListing() {
        val s = _state.value
        val ownerId = s.session?.userId ?: return
        if (s.isSubmittingListing) return
        viewModelScope.launch {
            _state.update { it.copy(isSubmittingListing = true) }
            try {
                repository.submitListingForReview(ownerId, s.draft).fold(
                    onSuccess = { submitted ->
                        _state.update { curr ->
                            val exists = curr.ownerListings.any { it.id == submitted.id }
                            val updated = if (exists) curr.ownerListings.map { if (it.id == submitted.id) submitted else it } else listOf(submitted) + curr.ownerListings
                            curr.copy(ownerListings = updated, selectedReviewListingId = submitted.id, draft = ListingDraft())
                        }
                        navigate(AttaieRoute.LISTING_REVIEW_STATUS)
                    },
                    onFailure = { err -> emitMessage(err.message ?: tr(s.language, "Submission failed.", "ارسال ناموفق بود.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(s.language, "Connection error.", "خطای اتصال."))
            } finally {
                _state.update { it.copy(isSubmittingListing = false) }
            }
        }
    }

    // --- Agency Onboarding, Validated Uploads & Server-Owned Status (K09) ---

    fun updateAgencyApp(transform: (AgencyApplication) -> AgencyApplication) =
        _state.update { it.copy(agencyApp = transform(it.agencyApp).copy(validationError = null)) }

    fun validateAndContinueAgencyRegistration() {
        val s = _state.value
        val a = s.agencyApp
        val lang = s.language
        val error = when {
            a.businessName.trim().length < 2 -> tr(lang, "Enter agency business name.", "نام رهنمای معاملات را وارد کنید.")
            a.registrationNo.isBlank() -> tr(lang, "Enter registration number.", "شماره ثبت را وارد کنید.")
            a.businessAddress.isBlank() -> tr(lang, "Enter business address.", "آدرس دفتر را وارد کنید.")
            a.representativeName.isBlank() -> tr(lang, "Enter representative name.", "نام نماینده رسمی را وارد کنید.")
            else -> null
        }
        if (error != null) {
            _state.update { it.copy(agencyApp = it.agencyApp.copy(validationError = error)) }
        } else {
            navigate(AttaieRoute.AGENCY_CONTACTS)
        }
    }

    fun validateAndContinueAgencyContacts() {
        val s = _state.value
        val a = s.agencyApp
        val lang = s.language
        val error = when {
            !isValidEmail(a.businessEmail.trim()) -> tr(lang, "Enter a valid business email.", "ایمیل رسمی معتبر وارد کنید.")
            !isValidPhone(a.businessPhone.trim()) -> tr(lang, "Enter a valid business phone.", "شماره تماس رسمی معتبر وارد کنید.")
            else -> null
        }
        if (error != null) {
            _state.update { it.copy(agencyApp = it.agencyApp.copy(validationError = error)) }
        } else {
            navigate(AttaieRoute.AGENCY_DOCUMENTS)
        }
    }

    fun uploadAgencyDoc(isRegistrationDoc: Boolean, fileName: String) {
        val ownerId = _state.value.session?.userId ?: return
        viewModelScope.launch {
            _state.update { s ->
                s.copy(
                    agencyApp = if (isRegistrationDoc) {
                        s.agencyApp.copy(registrationDocName = fileName, registrationUploadState = UploadState.UPLOADING, registrationUploadProgress = 0.05f)
                    } else {
                        s.agencyApp.copy(licenseDocName = fileName, licenseUploadState = UploadState.UPLOADING, licenseUploadProgress = 0.05f)
                    }
                )
            }
            try {
                repository.uploadAgencyDocument(ownerId, fileName) { progress ->
                    _state.update { s ->
                        s.copy(
                            agencyApp = if (isRegistrationDoc) s.agencyApp.copy(registrationUploadProgress = progress)
                            else s.agencyApp.copy(licenseUploadProgress = progress)
                        )
                    }
                }.fold(
                    onSuccess = { uploadedName ->
                        _state.update { s ->
                            s.copy(
                                agencyApp = if (isRegistrationDoc) {
                                    s.agencyApp.copy(registrationDocName = uploadedName, registrationUploadState = UploadState.UPLOADED, registrationUploadProgress = 1f)
                                } else {
                                    s.agencyApp.copy(licenseDocName = uploadedName, licenseUploadState = UploadState.UPLOADED, licenseUploadProgress = 1f)
                                }
                            )
                        }
                    },
                    onFailure = { err ->
                        _state.update { s ->
                            s.copy(
                                agencyApp = if (isRegistrationDoc) s.agencyApp.copy(registrationUploadState = UploadState.FAILED, registrationUploadProgress = 0f)
                                else s.agencyApp.copy(licenseUploadState = UploadState.FAILED, licenseUploadProgress = 0f)
                            )
                        }
                        emitMessage(err.message ?: tr(_state.value.language, "Upload failed.", "آپلود ناموفق بود."))
                    }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                _state.update { s ->
                    s.copy(
                        agencyApp = if (isRegistrationDoc) s.agencyApp.copy(registrationUploadState = UploadState.FAILED, registrationUploadProgress = 0f)
                        else s.agencyApp.copy(licenseUploadState = UploadState.FAILED, licenseUploadProgress = 0f)
                    )
                }
                emitMessage(e.message ?: tr(_state.value.language, "Upload failed.", "آپلود ناموفق بود."))
            }
        }
    }

    fun submitAgency() {
        val s = _state.value
        val ownerId = s.session?.userId ?: return
        val app = s.agencyApp
        if (s.isSubmittingAgency || app.isAnyUploadInProgress || !app.areRequiredDocsUploaded) {
            emitMessage(tr(s.language, "Wait for all required documents to finish uploading.", "تا تکمیل آپلود همه اسناد منتظر بمانید."))
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isSubmittingAgency = true) }
            try {
                repository.submitAgencyApplication(ownerId, app).fold(
                    onSuccess = { updated ->
                        _state.update { it.copy(agencyApp = updated) }
                        navigate(AttaieRoute.AGENCY_STATUS)
                    },
                    onFailure = { err -> emitMessage(err.message ?: tr(s.language, "Submission failed.", "ارسال ناموفق بود.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(s.language, "Connection error.", "خطای اتصال."))
            } finally {
                _state.update { it.copy(isSubmittingAgency = false) }
            }
        }
    }

    fun refreshAgencyStatus() {
        val s = _state.value
        val ownerId = s.session?.userId ?: return
        viewModelScope.launch {
            try {
                repository.refreshAgencyStatus(ownerId).fold(
                    onSuccess = { updated -> _state.update { it.copy(agencyApp = updated) } },
                    onFailure = { err -> emitMessage(err.message ?: tr(s.language, "Unable to refresh status.", "به‌روزرسانی وضعیت ممکن نیست.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(s.language, "Connection error.", "خطای اتصال."))
            }
        }
    }

    // --- Buyer Outbound Inquiry vs Seller Inbox & Notifications (K07) ---

    fun sendBuyerInquiry(propertyId: String, senderName: String, senderPhone: String, message: String) {
        val s = _state.value
        if (s.isSendingInquiry) return
        val lang = s.language
        if (senderName.trim().length < 2 || !isValidPhone(senderPhone.trim()) || message.trim().length < 5) {
            emitMessage(tr(lang, "Enter your name, valid phone, and a brief message.", "نام، شماره تماس معتبر و پیام کوتاه وارد کنید."))
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(isSendingInquiry = true) }
            try {
                repository.sendBuyerInquiry(propertyId, senderName.trim(), senderPhone.trim(), message.trim()).fold(
                    onSuccess = { emitMessage(tr(lang, "Inquiry sent to seller.", "پیام شما به فروشنده ارسال شد.")) },
                    onFailure = { err -> emitMessage(err.message ?: tr(lang, "Failed to send inquiry.", "ارسال پیام ناموفق بود.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(lang, "Connection error.", "خطای اتصال."))
            } finally {
                _state.update { it.copy(isSendingInquiry = false) }
            }
        }
    }

    fun openInquiry(inquiryId: String) {
        _state.update { s ->
            s.copy(
                selectedInquiryId = inquiryId,
                inquiries = s.inquiries.map { if (it.id == inquiryId) it.copy(unread = false) else it }
            )
        }
        navigate(AttaieRoute.INQUIRY_DETAILS)
    }

    fun sendInquiryReply(inquiryId: String, replyMessage: String) {
        val s = _state.value
        if (replyMessage.trim().length < 2) return
        viewModelScope.launch {
            try {
                repository.replyToInquiry(inquiryId, replyMessage.trim()).fold(
                    onSuccess = { emitMessage(tr(s.language, "Reply sent.", "پاسخ ارسال شد.")) },
                    onFailure = { err -> emitMessage(err.message ?: tr(s.language, "Reply failed.", "ارسال پاسخ ناموفق بود.")) }
                )
            } catch (ce: CancellationException) {
                throw ce
            } catch (e: Exception) {
                emitMessage(e.message ?: tr(s.language, "Connection error.", "خطای اتصال."))
            }
        }
    }

    fun openNotification(n: AppNotification) {
        _state.update { s ->
            val updatedNotifs = s.notifications.map { if (it.id == n.id) it.copy(unread = false) else it }
            s.copy(
                notifications = updatedNotifs,
                selectedReviewListingId = if (n.targetRoute == AttaieRoute.LISTING_REVIEW_STATUS && n.targetRecordId != null) n.targetRecordId else s.selectedReviewListingId,
                selectedInquiryId = if (n.targetRoute == AttaieRoute.INQUIRY_DETAILS && n.targetRecordId != null) n.targetRecordId else s.selectedInquiryId
            )
        }
        navigate(n.targetRoute)
    }

    fun updateProfile(name: String, email: String, phone: String) {
        _state.update { s ->
            s.copy(session = s.session?.copy(fullName = name.trim(), email = email.trim(), phone = phone.trim()))
        }
        emitMessage(tr(_state.value.language, "Profile updated.", "پروفایل به‌روزرسانی شد."))
    }

    fun setNotificationsEnabled(enabled: Boolean) = _state.update { it.copy(notificationsEnabled = enabled) }
}

// =============================================================================
// 5B. ANDROID ENTRY POINT (JETPACK COMPOSE + MATERIAL 3, NO XML LAYOUTS)
// =============================================================================

/**
 * Drop-in Android entry point wired directly to the existing `AttaieAppViewModel`.
 * Replace `UnconfiguredAttaieRepository()` with your production `AttaieRepository`
 * and pass `R.drawable.attaie_logo` into `AttaiePropertiesV2App`.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val appViewModel = ViewModelProvider(
            this,
            AttaieAppViewModel.factory(UnconfiguredAttaieRepository())
        )[AttaieAppViewModel::class.java]

        setContent {
            AttaiePropertiesV2App(
                viewModel = appViewModel,
                logoResId = null // Pass R.drawable.attaie_logo in your Android project
            )
        }
    }
}

// =============================================================================
// 6. ROOT APPLICATION HOST (ALL 24 SCREENS + SYSTEM BACK + AUTH GUARD)
// =============================================================================

@Composable
fun AttaiePropertiesV2App(
    viewModel: AttaieAppViewModel,
    @DrawableRes logoResId: Int? = null
) {
    val state by viewModel.state.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(viewModel) {
        viewModel.snackbar.collect { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    // Native Android System Back handling (fixes K08)
    BackHandler(enabled = state.backStack.isNotEmpty()) {
        viewModel.navigateBack()
    }

    val layoutDir = if (state.language.isRtl) LayoutDirection.Rtl else LayoutDirection.Ltr

    AttaieV2Theme {
        CompositionLocalProvider(LocalLayoutDirection provides layoutDir) {
            Scaffold(
                containerColor = MaterialTheme.colorScheme.background,
                snackbarHost = { SnackbarHost(snackbarHostState) },
                bottomBar = {
                    val activeTab = state.route.selectedBottomTab()
                    if (activeTab != null) {
                        AttaieBottomBar(
                            language = state.language,
                            activeTab = activeTab,
                            onSelect = viewModel::selectBottomTab
                        )
                    }
                }
            ) { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    if (state.route.requiresAuth && !state.isAuthenticated) {
                        AuthRequiredGate(state.language, onSignIn = { viewModel.navigate(AttaieRoute.LOGIN) })
                    } else {
                        AnimatedContent(
                            targetState = state.route,
                            transitionSpec = {
                                fadeIn(animationSpec = tween(200)) togetherWith fadeOut(animationSpec = tween(150))
                            },
                            label = "AttaieRouteTransition"
                        ) { targetRoute ->
                            when (targetRoute) {
                                AttaieRoute.WELCOME -> Screen01Welcome(state, logoResId, viewModel)
                                AttaieRoute.LOGIN -> Screen02Login(state, logoResId, viewModel)
                                AttaieRoute.CREATE_ACCOUNT -> Screen03CreateAccount(state, logoResId, viewModel)
                                AttaieRoute.VERIFICATION -> Screen04Verification(state, viewModel)
                                AttaieRoute.ACCOUNT_TYPE -> Screen05AccountType(state, logoResId, viewModel)
                                AttaieRoute.HOME -> Screen06HomeExplore(state, viewModel)
                                AttaieRoute.SEARCH -> Screen07Search(state, viewModel)
                                AttaieRoute.SEARCH_RESULTS -> Screen08SearchResults(state, viewModel)
                                AttaieRoute.ADVANCED_FILTERS -> Screen09AdvancedFilters(state, viewModel)
                                AttaieRoute.PROPERTY_DETAILS -> Screen10PropertyDetails(state, viewModel)
                                AttaieRoute.SAVED -> Screen11SavedProperties(state, viewModel)
                                AttaieRoute.DASHBOARD -> Screen12CustomerDashboard(state, viewModel)
                                AttaieRoute.MY_PROPERTIES -> Screen13MyProperties(state, viewModel)
                                AttaieRoute.ADD_EDIT_PROPERTY -> Screen14AddEditProperty(state, viewModel)
                                AttaieRoute.LISTING_REVIEW_STATUS -> Screen15ListingReviewStatus(state, viewModel)
                                AttaieRoute.AGENCY_REGISTRATION -> Screen16AgencyRegistration(state, viewModel)
                                AttaieRoute.AGENCY_CONTACTS -> Screen17AgencyContacts(state, viewModel)
                                AttaieRoute.AGENCY_DOCUMENTS -> Screen18AgencyDocuments(state, viewModel)
                                AttaieRoute.AGENCY_STATUS -> Screen19AgencyStatus(state, viewModel)
                                AttaieRoute.AGENCY_CORRECTION -> Screen20AgencyCorrection(state, viewModel)
                                AttaieRoute.INQUIRIES -> Screen21Inquiries(state, viewModel)
                                AttaieRoute.INQUIRY_DETAILS -> Screen22InquiryDetails(state, viewModel)
                                AttaieRoute.NOTIFICATIONS -> Screen23Notifications(state, viewModel)
                                AttaieRoute.PROFILE -> Screen24ProfileSettings(state, viewModel)
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AttaieTopBar(
    title: String,
    onBack: (() -> Unit)? = null,
    trailing: @Composable () -> Unit = {}
) {
    Surface(color = MaterialTheme.colorScheme.surface, tonalElevation = 0.dp) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    if (onBack != null) {
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f),
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            IconButton(
                                onClick = onBack,
                                modifier = Modifier.sizeIn(minWidth = 44.dp, minHeight = 44.dp)
                            ) {
                                Icon(
                                    Icons.AutoMirrored.Rounded.ArrowBack,
                                    contentDescription = "Back",
                                    tint = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.size(19.dp)
                                )
                            }
                        }
                    }
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                trailing()
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.7f))
        }
    }
}

@Composable
private fun AttaieBottomBar(
    language: AppLang,
    activeTab: BottomTab,
    onSelect: (BottomTab) -> Unit
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 6.dp
    ) {
        Column {
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.75f))
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                tonalElevation = 0.dp,
                modifier = Modifier.navigationBarsPadding()
            ) {
                BottomTab.entries.forEach { tab ->
                    val selected = tab == activeTab
                    NavigationBarItem(
                        selected = selected,
                        onClick = { onSelect(tab) },
                        icon = {
                            Icon(
                                tab.icon,
                                contentDescription = tr(language, tab.en, tab.da),
                                modifier = Modifier.size(22.dp)
                            )
                        },
                        label = {
                            Text(
                                text = tr(language, tab.en, tab.da),
                                fontSize = 10.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = BrandPalette.BlueSoft,
                            unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }
        }
    }
}

/**
 * PrimaryGreenButton — `onClick` is the LAST parameter so trailing lambdas compile cleanly (fixes K01).
 */
@Composable
private fun PrimaryGreenButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = modifier.fillMaxWidth().sizeIn(minHeight = 52.dp),
        shape = RoundedCornerShape(16.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = BrandPalette.GreenAccessible,
            contentColor = Color.White,
            disabledContainerColor = BrandPalette.GreenAccessible.copy(alpha = 0.42f),
            disabledContentColor = Color.White.copy(alpha = 0.9f)
        ),
        elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp, pressedElevation = 1.dp)
    ) {
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

/**
 * SecondaryBlueButton — `onClick` is the LAST parameter so trailing lambdas compile cleanly (fixes K01).
 */
@Composable
private fun SecondaryBlueButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth().sizeIn(minHeight = 50.dp),
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)),
        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

// =============================================================================
// 7. SHARED REUSABLE UI COMPONENTS (ACCESSIBLE, DARK-SAFE, RESPONSIVE)
// =============================================================================

@Composable
private fun MinimalField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    errorMessage: String? = null,
    singleLine: Boolean = true,
    enabled: Boolean = true,
    forceLtrText: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: (() -> Unit)? = null,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    leadingIcon: ImageVector? = null,
    trailingContent: @Composable (() -> Unit)? = null
) {
    val focusManager = LocalFocusManager.current
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        enabled = enabled,
        singleLine = singleLine,
        minLines = if (singleLine) 1 else 3,
        isError = errorMessage != null,
        label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        placeholder = if (placeholder.isNotBlank()) {
            { Text(placeholder, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.65f)) }
        } else null,
        textStyle = if (forceLtrText) TextStyle(fontSize = 14.sp, textDirection = TextDirection.Ltr) else TextStyle(fontSize = 14.sp),
        leadingIcon = leadingIcon?.let {
            { Icon(it, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(19.dp)) }
        },
        trailingIcon = trailingContent,
        visualTransformation = visualTransformation,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = imeAction),
        keyboardActions = KeyboardActions(
            onNext = { onImeAction?.invoke() ?: focusManager.moveFocus(FocusDirection.Down) },
            onDone = {
                focusManager.clearFocus()
                onImeAction?.invoke()
            },
            onSearch = {
                focusManager.clearFocus()
                onImeAction?.invoke()
            }
        ),
        supportingText = errorMessage?.let { { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 11.sp) } },
        shape = RoundedCornerShape(14.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MaterialTheme.colorScheme.primary,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
            errorBorderColor = MaterialTheme.colorScheme.error,
            focusedContainerColor = MaterialTheme.colorScheme.surface,
            unfocusedContainerColor = MaterialTheme.colorScheme.surface
        )
    )
}

/**
 * Renders the official Attaie Properties logo strictly unmodified (`colorFilter = null`, `ContentScale.Fit`).
 */
@Composable
private fun OfficialAttaieLogo(@DrawableRes logoResId: Int?, heightDp: Int = 48) {
    if (logoResId != null) {
        Image(
            painter = painterResource(id = logoResId),
            contentDescription = "Attaie Properties",
            contentScale = ContentScale.Fit,
            colorFilter = null,
            modifier = Modifier.height(heightDp.dp)
        )
    } else {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .clip(RoundedCornerShape(10.dp))
                .background(BrandPalette.BlueSoft)
                .padding(horizontal = 12.dp, vertical = 8.dp)
        ) {
            Icon(Icons.Rounded.Apartment, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(20.dp))
            Column {
                Text("ATTAIE", color = BrandPalette.GreenAccessible, fontWeight = FontWeight.ExtraBold, fontSize = 14.sp, lineHeight = 14.sp)
                Text("PROPERTIES", color = BrandPalette.Gray, fontWeight = FontWeight.SemiBold, fontSize = 9.sp, letterSpacing = 1.4.sp, lineHeight = 10.sp)
            }
        }
    }
}

@Composable
private fun FilterPill(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .sizeIn(minHeight = 40.dp)
            .clip(RoundedCornerShape(50))
            .semantics { this.selected = selected }
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(50),
        color = if (selected) BrandPalette.BlueAccessible else MaterialTheme.colorScheme.surface,
        border = if (selected) null else BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Box(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 9.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = label,
                fontSize = 12.sp,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                color = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun StatusPill(text: String, bg: Color, fg: Color) {
    Surface(shape = RoundedCornerShape(50), color = bg) {
        Text(
            text = text,
            color = fg,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
        )
    }
}

@Composable
private fun ListingStatusBadge(status: ListingStatus, lang: AppLang) {
    val (bg, fg) = when (status) {
        ListingStatus.PUBLISHED -> BrandPalette.GreenSoft to BrandPalette.GreenAccessible
        ListingStatus.PENDING -> BrandPalette.BlueSoft to BrandPalette.BlueAccessible
        ListingStatus.REJECTED -> BrandPalette.DangerSoft to BrandPalette.Danger
        ListingStatus.DRAFT, ListingStatus.SOLD, ListingStatus.RENTED ->
            MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
    StatusPill(tr(lang, status.en, status.da), bg, fg)
}

@Composable
private fun SpecChip(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(14.dp))
        Text(text, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun DetailSpecTile(icon: ImageVector, value: String, label: String, modifier: Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.8f))
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
            Text(value, fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1)
            Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
        }
    }
}

@Composable
private fun MetricTile(label: String, value: String, color: Color, modifier: Modifier, onClick: () -> Unit) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 1.dp,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Box(modifier = Modifier.width(22.dp).height(3.dp).clip(RoundedCornerShape(50)).background(color))
            Spacer(Modifier.height(2.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = color)
            Text(label, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun SettingsRow(icon: ImageVector, label: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().sizeIn(minHeight = 56.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 1.dp,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.85f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Surface(shape = RoundedCornerShape(10.dp), color = BrandPalette.BlueSoft, modifier = Modifier.size(36.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(18.dp))
                    }
                }
                Text(label, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold))
            }
            Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun EmptyStateCard(
    icon: ImageVector,
    title: String,
    body: String,
    ctaLabel: String? = null,
    onCta: (() -> Unit)? = null
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Surface(shape = CircleShape, color = BrandPalette.BlueSoft, modifier = Modifier.size(52.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(icon, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(24.dp))
                }
            }
            Text(title, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
            Text(body, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
            if (ctaLabel != null && onCta != null) {
                Spacer(Modifier.height(4.dp))
                PrimaryGreenButton(text = ctaLabel, onClick = onCta)
            }
        }
    }
}

@Composable
private fun AuthRequiredGate(lang: AppLang, onSignIn: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        EmptyStateCard(
            icon = Icons.Rounded.Lock,
            title = tr(lang, "Sign In Required", "ورود به حساب ضروری است"),
            body = tr(
                lang,
                "Please sign in to access your private listings, agency verification, inquiries, and notifications.",
                "برای دسترسی به ملکیت‌های شخصی، تایید رهنمای معاملات، پیام‌ها و اعلان‌ها وارد حساب خود شوید."
            ),
            ctaLabel = tr(lang, "Sign In", "ورود به حساب"),
            onCta = onSignIn
        )
    }
}

@Composable
private fun PropertyImageFrame(
    label: String,
    imageCount: Int,
    modifier: Modifier = Modifier
) {
    // Production integration: replace this architectural canvas with Coil AsyncImage(model = imageUrl)
    val isDark = isSystemInDarkTheme()
    val baseTop = if (isDark) Color(0xFF1A222C) else Color(0xFFE7EDF3)
    val baseBottom = if (isDark) Color(0xFF11161D) else Color(0xFFD5E0EA)
    val gridColor = if (isDark) Color.White.copy(alpha = 0.05f) else BrandPalette.Blue.copy(alpha = 0.10f)

    Box(
        modifier = modifier.background(Brush.verticalGradient(listOf(baseTop, baseBottom))),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val step = 36.dp.toPx()
            var x = 0f
            while (x < size.width) {
                drawLine(gridColor, Offset(x, 0f), Offset(x, size.height), strokeWidth = 1f)
                x += step
            }
            var y = 0f
            while (y < size.height) {
                drawLine(gridColor, Offset(0f, y), Offset(size.width, y), strokeWidth = 1f)
                y += step
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Surface(
                shape = CircleShape,
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.90f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.6f)),
                modifier = Modifier.size(48.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        Icons.Rounded.Apartment,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            Surface(
                shape = RoundedCornerShape(50),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.88f)
            ) {
                Text(
                    text = if (imageCount > 0) "$label • $imageCount" else label,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .align(Alignment.BottomCenter)
                .background(Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = 0.28f))))
        )
    }
}

@Composable
private fun PropertyCard(
    listing: PropertyListing,
    lang: AppLang,
    isSaved: Boolean,
    onToggleSave: () -> Unit,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(22.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 2.dp,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.85f))
    ) {
        Column {
            Box(modifier = Modifier.fillMaxWidth().aspectRatio(16f / 10f)) {
                PropertyImageFrame(
                    label = tr(lang, listing.categoryEn, listing.categoryDa),
                    imageCount = listing.imageUrls.size,
                    modifier = Modifier.fillMaxSize()
                )
                Row(
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(shape = RoundedCornerShape(10.dp), color = Color.White.copy(alpha = 0.94f)) {
                        Text(
                            text = tr(lang, listing.dealType.en, listing.dealType.da),
                            color = BrandPalette.Ink,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp)
                        )
                    }
                    IconButton(
                        onClick = onToggleSave,
                        modifier = Modifier
                            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.94f))
                    ) {
                        Icon(
                            imageVector = if (isSaved) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder,
                            contentDescription = if (isSaved) tr(lang, "Remove from saved", "حذف از ذخیره‌شده") else tr(lang, "Save property", "ذخیره ملکیت"),
                            tint = if (isSaved) BrandPalette.GreenAccessible else BrandPalette.Gray,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = BrandPalette.Ink.copy(alpha = 0.88f),
                    modifier = Modifier.align(Alignment.BottomStart).padding(12.dp)
                ) {
                    Text(
                        text = listing.priceDisplay,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        letterSpacing = (-0.2).sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                    )
                }
            }
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = tr(lang, listing.titleEn, listing.titleDa),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    Icon(Icons.Rounded.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(15.dp))
                    Text(
                        text = "${tr(lang, listing.districtEn, listing.districtDa)}, ${tr(lang, listing.cityEn, listing.cityDa)}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.7f), modifier = Modifier.padding(vertical = 4.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    SpecChip(Icons.Rounded.Bed, "${if (listing.beds == 0) "-" else listing.beds} ${tr(lang, "Beds", "اطاق")}")
                    SpecChip(Icons.Rounded.Bathtub, "${listing.baths} ${tr(lang, "Baths", "حمام")}")
                    SpecChip(Icons.Rounded.SquareFoot, "${listing.areaSqm} ${tr(lang, "sqm", "م²")}")
                }
            }
        }
    }
}

@Composable
private fun AccountTypeCard(isSelected: Boolean, icon: ImageVector, title: String, description: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .selectable(selected = isSelected, role = Role.RadioButton, onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        color = if (isSelected) BrandPalette.BlueSoft.copy(alpha = 0.45f) else MaterialTheme.colorScheme.surface,
        shadowElevation = if (isSelected) 2.dp else 0.dp,
        border = BorderStroke(if (isSelected) 2.dp else 1.dp, if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (isSelected) BrandPalette.BlueAccessible else MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.size(44.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            icon,
                            contentDescription = null,
                            tint = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
                if (isSelected) {
                    Icon(Icons.Rounded.CheckCircle, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(22.dp))
                }
            }
            Text(title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            Text(description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AgencyDocumentUploadCard(
    title: String,
    fileName: String,
    uploadState: UploadState,
    progress: Float,
    lang: AppLang,
    onPick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(title, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                    Text(
                        text = fileName.ifBlank { tr(lang, "No file selected (PDF, JPG, PNG)", "فایلی انتخاب نشده (PDF, JPG, PNG)") },
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                val (bg, fg, statusText) = when (uploadState) {
                    UploadState.IDLE -> Triple(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant, tr(lang, "Required", "ضروری"))
                    UploadState.UPLOADING -> Triple(BrandPalette.BlueSoft, BrandPalette.BlueAccessible, "${(progress * 100).toInt()}%")
                    UploadState.UPLOADED -> Triple(BrandPalette.GreenSoft, BrandPalette.GreenAccessible, tr(lang, "Uploaded", "آپلود شد"))
                    UploadState.FAILED -> Triple(BrandPalette.DangerSoft, BrandPalette.Danger, tr(lang, "Failed", "ناموفق"))
                }
                StatusPill(statusText, bg, fg)
            }
            if (uploadState == UploadState.UPLOADING) {
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(50)),
                    color = BrandPalette.BlueAccessible,
                    trackColor = BrandPalette.BlueSoft
                )
            }
            SecondaryBlueButton(
                text = if (uploadState == UploadState.UPLOADED) tr(lang, "Replace Document", "تعویض سند") else tr(lang, "Select & Upload Document", "انتخاب و آپلود سند"),
                enabled = uploadState != UploadState.UPLOADING,
                onClick = onPick
            )
        }
    }
}

// =============================================================================
// 8. SCREENS 01–05: ONBOARDING & AUTHENTICATION
// =============================================================================

@Composable
private fun Screen01Welcome(state: AttaieAppState, @DrawableRes logoResId: Int?, vm: AttaieAppViewModel) {
    val lang = state.language
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0E1319))
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val step = 44.dp.toPx()
            val lineColor = Color.White.copy(alpha = 0.045f)
            var x = 0f
            while (x < size.width) {
                drawLine(lineColor, Offset(x, 0f), Offset(x, size.height), strokeWidth = 1f)
                x += step
            }
            var y = 0f
            while (y < size.height) {
                drawLine(lineColor, Offset(0f, y), Offset(size.width, y), strokeWidth = 1f)
                y += step
            }
        }
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(
                            Color(0xFF0E1319).copy(alpha = 0.35f),
                            Color(0xFF0E1319).copy(alpha = 0.85f),
                            Color(0xFF0E1319)
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                Surface(
                    shape = RoundedCornerShape(50),
                    color = Color.White.copy(alpha = 0.96f),
                    modifier = Modifier
                        .sizeIn(minHeight = 44.dp)
                        .clickable { vm.toggleLanguage() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(Icons.Rounded.Language, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(16.dp))
                        Text(lang.label, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = BrandPalette.Ink)
                    }
                }
            }

            Spacer(Modifier.height(56.dp))

            Column(verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Surface(shape = RoundedCornerShape(18.dp), color = Color.White, shadowElevation = 4.dp) {
                    Box(modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                        OfficialAttaieLogo(logoResId, heightDp = 50)
                    }
                }
                Text(
                    text = tr(lang, "GATEWAY OF TRANSPARENT DEALINGS", "دروازه معاملات شفاف"),
                    color = BrandPalette.Blue,
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 1.4.sp)
                )
                Text(
                    text = tr(lang, "Refined Real Estate Across Afghanistan.", "بازار معیاری و شفاف ملکیت در سراسر افغانستان."),
                    color = Color.White,
                    style = MaterialTheme.typography.headlineLarge
                )
                Text(
                    text = tr(
                        lang,
                        "Discover residential villas, apartments, and commercial spaces through a transparent, professionally curated marketplace.",
                        "حویلی‌ها، اپارتمان‌های عصری و مکان‌های تجارتی را در یک پلتفرم شفاف و معیاری کشف نمایید."
                    ),
                    color = Color.White.copy(alpha = 0.82f),
                    style = MaterialTheme.typography.bodyMedium
                )
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.08f),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.14f))
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(tr(lang, "Reviewed Listings", "اعلانات بررسی‌شده"), color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        Text("•", color = BrandPalette.Green, fontSize = 12.sp)
                        Text(tr(lang, "Direct & Agencies", "مالکین و رهنماها"), color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        Text("•", color = BrandPalette.Blue, fontSize = 12.sp)
                        Text(tr(lang, "EN & دری", "دری و انگلیسی"), color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    }
                }
                Spacer(Modifier.height(4.dp))
                PrimaryGreenButton(text = tr(lang, "Explore Properties", "مشاهده ملکیت‌ها")) {
                    vm.navigate(AttaieRoute.HOME, clearBackStack = true)
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = { vm.navigate(AttaieRoute.LOGIN) },
                        modifier = Modifier.weight(1f).sizeIn(minHeight = 50.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = BrandPalette.BlueAccessible)
                    ) { Text(tr(lang, "Sign In", "ورود"), fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                    OutlinedButton(
                        onClick = { vm.navigate(AttaieRoute.CREATE_ACCOUNT) },
                        modifier = Modifier.weight(1f).sizeIn(minHeight = 50.dp),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.45f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                    ) { Text(tr(lang, "Create Account", "ثبت نام"), fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                }
            }
        }
    }
}

@Composable
private fun Screen02Login(state: AttaieAppState, @DrawableRes logoResId: Int?, vm: AttaieAppViewModel) {
    val lang = state.language
    val form = state.loginForm

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(
            title = tr(lang, "Sign In", "ورود به حساب"),
            onBack = { vm.navigateBack() },
            trailing = {
                TextButton(onClick = { vm.toggleLanguage() }) {
                    Text(lang.label, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OfficialAttaieLogo(logoResId, heightDp = 50)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(tr(lang, "Welcome Back", "خوش آمدید"), style = MaterialTheme.typography.headlineMedium)
                Text(
                    tr(lang, "Sign in to manage saved properties, listings, and inquiries.", "برای مدیریت ملکیت‌های ذخیره‌شده، اعلانات و پیام‌ها وارد حساب شوید."),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            if (form.formError != null) {
                Surface(shape = RoundedCornerShape(12.dp), color = BrandPalette.DangerSoft) {
                    Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Rounded.ErrorOutline, contentDescription = null, tint = BrandPalette.Danger, modifier = Modifier.size(18.dp))
                        Text(form.formError, color = BrandPalette.Danger, fontSize = 12.sp)
                    }
                }
            }
            MinimalField(
                label = tr(lang, "Email or Phone Number", "ایمیل یا شماره تماس"),
                value = form.identifier,
                onValueChange = { v -> vm.updateLoginForm { it.copy(identifier = v, identifierError = null, formError = null) } },
                errorMessage = form.identifierError,
                forceLtrText = true,
                keyboardType = KeyboardType.Email,
                leadingIcon = Icons.Rounded.Email
            )
            MinimalField(
                label = tr(lang, "Password", "رمز عبور"),
                value = form.password,
                onValueChange = { v -> vm.updateLoginForm { it.copy(password = v, passwordError = null, formError = null) } },
                errorMessage = form.passwordError,
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
                onImeAction = { vm.performLogin() },
                leadingIcon = Icons.Rounded.Lock,
                visualTransformation = if (form.passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingContent = {
                    IconButton(onClick = { vm.updateLoginForm { it.copy(passwordVisible = !it.passwordVisible) } }) {
                        Icon(
                            if (form.passwordVisible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                            contentDescription = if (form.passwordVisible) tr(lang, "Hide password", "پنهان کردن رمز عبور") else tr(lang, "Show password", "نمایش رمز عبور")
                        )
                    }
                }
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { vm.updateLoginForm { it.copy(rememberMe = !it.rememberMe) } }
                ) {
                    Checkbox(
                        checked = form.rememberMe,
                        onCheckedChange = { c -> vm.updateLoginForm { it.copy(rememberMe = c) } },
                        colors = CheckboxDefaults.colors(checkedColor = BrandPalette.BlueAccessible)
                    )
                    Text(tr(lang, "Remember me", "مرا به خاطر بسپار"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                TextButton(onClick = { vm.requestPasswordRecovery() }) {
                    Text(tr(lang, "Forgot password?", "فراموشی رمز عبور؟"), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary)
                }
            }
            PrimaryGreenButton(
                text = tr(lang, "Sign In", "ورود به حساب"),
                loading = state.isAuthLoading
            ) { vm.performLogin() }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Text(tr(lang, "Don't have an account?", "حساب ندارید؟"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                TextButton(onClick = { vm.navigate(AttaieRoute.CREATE_ACCOUNT) }) {
                    Text(tr(lang, "Create Account", "ایجاد حساب"), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}

@Composable
private fun Screen03CreateAccount(state: AttaieAppState, @DrawableRes logoResId: Int?, vm: AttaieAppViewModel) {
    val lang = state.language
    val form = state.registerForm

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Create Account", "ایجاد حساب کاربری"), onBack = { vm.navigateBack() })
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OfficialAttaieLogo(logoResId, heightDp = 42)
            Text(
                tr(lang, "Register to save favorites, submit listings, or verify an agency.", "برای ذخیره ملکیت‌ها، ثبت اعلان یا تایید رهنمای معاملات ثبت نام کنید."),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (form.error != null) {
                Surface(shape = RoundedCornerShape(12.dp), color = BrandPalette.DangerSoft) {
                    Text(form.error, color = BrandPalette.Danger, fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(12.dp))
                }
            }
            MinimalField(tr(lang, "Full Name", "نام و تخلص"), form.fullName, { v -> vm.updateRegisterForm { it.copy(fullName = v, error = null) } }, leadingIcon = Icons.Rounded.Person)
            MinimalField(tr(lang, "Email Address", "آدرس ایمیل"), form.email, { v -> vm.updateRegisterForm { it.copy(email = v, error = null) } }, forceLtrText = true, keyboardType = KeyboardType.Email, leadingIcon = Icons.Rounded.Email)
            MinimalField(tr(lang, "Phone Number", "شماره تماس"), form.phone, { v -> vm.updateRegisterForm { it.copy(phone = v, error = null) } }, forceLtrText = true, keyboardType = KeyboardType.Phone, leadingIcon = Icons.Rounded.Phone)
            MinimalField(
                label = tr(lang, "Password (8+ chars)", "رمز عبور (حداقل ۸ حرف)"),
                value = form.password,
                onValueChange = { v -> vm.updateRegisterForm { it.copy(password = v, error = null) } },
                keyboardType = KeyboardType.Password,
                leadingIcon = Icons.Rounded.Lock,
                visualTransformation = if (form.passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingContent = {
                    IconButton(onClick = { vm.updateRegisterForm { it.copy(passwordVisible = !it.passwordVisible) } }) {
                        Icon(
                            if (form.passwordVisible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                            contentDescription = if (form.passwordVisible) tr(lang, "Hide password", "پنهان کردن رمز عبور") else tr(lang, "Show password", "نمایش رمز عبور")
                        )
                    }
                }
            )
            MinimalField(
                label = tr(lang, "Confirm Password", "تایید رمز عبور"),
                value = form.confirmPassword,
                onValueChange = { v -> vm.updateRegisterForm { it.copy(confirmPassword = v, error = null) } },
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
                leadingIcon = Icons.Rounded.Lock,
                visualTransformation = if (form.confirmVisible) VisualTransformation.None else PasswordVisualTransformation(),
                trailingContent = {
                    IconButton(onClick = { vm.updateRegisterForm { it.copy(confirmVisible = !it.confirmVisible) } }) {
                        Icon(
                            if (form.confirmVisible) Icons.Rounded.VisibilityOff else Icons.Rounded.Visibility,
                            contentDescription = if (form.confirmVisible) tr(lang, "Hide confirm password", "پنهان کردن تایید رمز") else tr(lang, "Show confirm password", "نمایش تایید رمز")
                        )
                    }
                }
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth().clickable { vm.updateRegisterForm { it.copy(agreedToTerms = !it.agreedToTerms) } }
            ) {
                Checkbox(
                    checked = form.agreedToTerms,
                    onCheckedChange = { c -> vm.updateRegisterForm { it.copy(agreedToTerms = c) } },
                    colors = CheckboxDefaults.colors(checkedColor = BrandPalette.BlueAccessible)
                )
                Text(
                    tr(lang, "I accept the Terms of Service and Privacy Policy.", "با شرایط استفاده و حریم خصوصی موافقت می‌کنم."),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            PrimaryGreenButton(
                text = tr(lang, "Create Account", "ایجاد حساب"),
                loading = state.isAuthLoading
            ) { vm.submitCreateAccount() }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Text(tr(lang, "Already have an account?", "حساب دارید؟"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                TextButton(onClick = { vm.navigate(AttaieRoute.LOGIN) }) {
                    Text(tr(lang, "Sign In", "ورود"), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}

@Composable
private fun Screen04Verification(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val vf = state.verificationForm
    var resendCooldownSec by remember { mutableStateOf(0) }

    LaunchedEffect(resendCooldownSec) {
        if (resendCooldownSec > 0) {
            delay(1000)
            resendCooldownSec -= 1
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Account Verification", "تایید حساب کاربری"), onBack = { vm.navigateBack() })
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterPill(tr(lang, "Phone OTP", "کود موبایل"), vf.isOtpMode) {
                    vm.updateVerificationForm { it.copy(isOtpMode = true, error = null) }
                }
                FilterPill(tr(lang, "Email Link", "لینک ایمیل"), !vf.isOtpMode) {
                    vm.updateVerificationForm { it.copy(isOtpMode = false, error = null) }
                }
            }

            Surface(shape = RoundedCornerShape(16.dp), color = BrandPalette.BlueSoft, modifier = Modifier.size(52.dp)) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        if (vf.isOtpMode) Icons.Rounded.Phone else Icons.Rounded.Email,
                        contentDescription = null,
                        tint = BrandPalette.BlueAccessible,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Text(
                text = if (vf.isOtpMode) tr(lang, "Verify Phone Number", "تایید شماره تماس") else tr(lang, "Verify Email Address", "تایید آدرس ایمیل"),
                style = MaterialTheme.typography.headlineMedium
            )
            Text(
                text = if (vf.isOtpMode) {
                    tr(
                        lang,
                        "Enter the 6-digit verification code sent to ${vf.destinationLabel.ifBlank { state.session?.phone.orEmpty() }}.",
                        "کود ۶ رقمی ارسال‌شده به ${vf.destinationLabel.ifBlank { state.session?.phone.orEmpty() }} را وارد کنید."
                    )
                } else {
                    tr(
                        lang,
                        "Open the verification link sent to ${state.session?.email.orEmpty()} and then continue.",
                        "لینک تایید ارسال‌شده به ${state.session?.email.orEmpty()} را باز کرده و ادامه دهید."
                    )
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            if (vf.isOtpMode) {
                MinimalField(
                    label = tr(lang, "6-Digit Code", "کود ۶ رقمی"),
                    value = vf.otpCode,
                    onValueChange = { v ->
                        vm.updateVerificationForm { it.copy(otpCode = v.filter { c -> c.isDigit() }.take(6), error = null) }
                    },
                    forceLtrText = true,
                    keyboardType = KeyboardType.Number,
                    imeAction = ImeAction.Done,
                    onImeAction = { vm.submitVerification() }
                )
            } else {
                Surface(
                    shape = RoundedCornerShape(14.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Text(
                        tr(lang, "Check your inbox and spam folder for the Attaie Properties confirmation email.", "صندوق ورودی و بخش اسپم ایمیل خود را برای پیام تایید عطایی پراپرتیز بررسی کنید."),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.fillMaxWidth().padding(14.dp)
                    )
                }
            }

            if (vf.error != null) {
                Surface(shape = RoundedCornerShape(12.dp), color = BrandPalette.DangerSoft) {
                    Text(vf.error, color = BrandPalette.Danger, fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(12.dp))
                }
            }
            if (vf.verified) {
                Surface(shape = RoundedCornerShape(12.dp), color = BrandPalette.GreenSoft) {
                    Text(
                        tr(lang, "Account verified successfully.", "حساب شما با موفقیت تایید شد."),
                        color = BrandPalette.GreenAccessible,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.fillMaxWidth().padding(12.dp)
                    )
                }
            }

            TextButton(
                enabled = resendCooldownSec == 0 && !state.isAuthLoading,
                onClick = {
                    vm.resendVerificationCode()
                    resendCooldownSec = 45
                }
            ) {
                Text(
                    text = if (resendCooldownSec > 0) {
                        tr(lang, "Resend available in ${resendCooldownSec}s", "ارسال مجدد تا ${resendCooldownSec} ثانیه دیگر")
                    } else {
                        tr(lang, "Resend Verification", "ارسال مجدد کود تایید")
                    },
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold
                )
            }

            PrimaryGreenButton(
                text = tr(lang, "Verify & Continue", "تایید و ادامه"),
                loading = state.isAuthLoading
            ) { vm.submitVerification() }
        }
    }
}

@Composable
private fun Screen05AccountType(state: AttaieAppState, @DrawableRes logoResId: Int?, vm: AttaieAppViewModel) {
    val lang = state.language
    val selectedType = state.session?.accountType ?: AccountType.INDIVIDUAL

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Account Type", "نوع حساب"), onBack = { vm.navigateBack() })
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OfficialAttaieLogo(logoResId, heightDp = 42)
            Text(tr(lang, "Choose Account Type", "انتخاب نوع حساب"), style = MaterialTheme.typography.headlineMedium)
            Text(
                tr(lang, "Select how you will use Attaie Properties.", "مشخص کنید چگونه از عطایی پراپرتیز استفاده می‌نمایید."),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            AccountTypeCard(
                isSelected = selectedType == AccountType.INDIVIDUAL,
                icon = Icons.Rounded.Person,
                title = tr(lang, "Individual Account", "حساب انفرادی"),
                description = tr(
                    lang,
                    "For customers who browse, save, and manage their own properties.",
                    "برای مشتریانی که ملکیت‌ها را جستجو، ذخیره و ملکیت‌های شخصی خود را مدیریت می‌کنند."
                ),
                onClick = { vm.selectAccountType(AccountType.INDIVIDUAL) }
            )
            AccountTypeCard(
                isSelected = selectedType == AccountType.AGENCY,
                icon = Icons.Rounded.Business,
                title = tr(lang, "Real Estate Agency", "رهنمای معاملات"),
                description = tr(
                    lang,
                    "For professional agencies that manage listings and require business verification.",
                    "برای دفاتر رهنمای معاملات حرفه‌ای که اعلانات را مدیریت می‌کنند و نیاز به تایید جواز دارند."
                ),
                onClick = { vm.selectAccountType(AccountType.AGENCY) }
            )
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 6.dp) {
            Box(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(20.dp)) {
                PrimaryGreenButton(text = tr(lang, "Continue", "ادامه")) {
                    if (selectedType == AccountType.AGENCY) {
                        vm.navigate(AttaieRoute.AGENCY_REGISTRATION)
                    } else {
                        vm.navigate(AttaieRoute.HOME, clearBackStack = true)
                    }
                }
            }
        }
    }
}

// =============================================================================
// 9. SCREENS 06–11: HOME, SEARCH, RESULTS, FILTERS, DETAILS & SAVED
// =============================================================================

@Composable
private fun Screen06HomeExplore(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val publishedForDeal = remember(state.publicListings, state.homeDealFilter) {
        state.publicListings.filter { it.status == ListingStatus.PUBLISHED && it.dealType == state.homeDealFilter }
    }
    val unreadNotifs = state.notifications.count { it.unread }

    LazyColumn(
        modifier = Modifier.fillMaxSize().statusBarsPadding(),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = state.session?.let { tr(lang, "Welcome back, ${it.fullName}", "خوش آمدید، ${it.fullName}") }
                            ?: tr(lang, "Attaie Properties", "عطایی پراپرتیز"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = tr(lang, "Explore Afghanistan Real Estate", "کشف ملکیت‌های برتر افغانستان"),
                        style = MaterialTheme.typography.headlineMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                IconButton(
                    onClick = { vm.navigate(AttaieRoute.NOTIFICATIONS) },
                    modifier = Modifier
                        .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface)
                        .border(1.dp, MaterialTheme.colorScheme.outline, CircleShape)
                ) {
                    Box {
                        Icon(
                            Icons.Rounded.Notifications,
                            contentDescription = tr(lang, "Notifications", "اعلان‌ها"),
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                        if (unreadNotifs > 0) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(BrandPalette.BlueAccessible)
                                    .align(Alignment.TopEnd)
                            )
                        }
                    }
                }
            }
        }

        // Unified Elevated Search Capsule + Filter Trigger
        item {
            Surface(
                modifier = Modifier.fillMaxWidth().clickable { vm.navigate(AttaieRoute.SEARCH) },
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 2.dp,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(start = 16.dp, end = 8.dp, top = 8.dp, bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Rounded.Search, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Text(
                            text = state.searchQuery.ifBlank { tr(lang, "Search district, city, or type...", "جستجوی ناحیه، شهر یا نوع ملکیت...") },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = BrandPalette.BlueAccessible,
                        modifier = Modifier
                            .sizeIn(minWidth = 44.dp, minHeight = 44.dp)
                            .clickable { vm.openAdvancedFilters() }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                Icons.Rounded.Tune,
                                contentDescription = tr(lang, "Open filters", "باز کردن فلترها"),
                                tint = Color.White,
                                modifier = Modifier.size(19.dp)
                            )
                        }
                    }
                }
            }
        }

        // Buy / Rent Segmented Pill Toggle
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterPill(tr(lang, "Buy", "خرید"), state.homeDealFilter == DealType.BUY) {
                        vm.setHomeDealFilter(DealType.BUY)
                    }
                    FilterPill(tr(lang, "Rent", "کرایه"), state.homeDealFilter == DealType.RENT) {
                        vm.setHomeDealFilter(DealType.RENT)
                    }
                }
                TextButton(onClick = { vm.openSeeAllFromHome() }) {
                    Text(tr(lang, "See All", "مشاهده همه"), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        if (state.isCatalogLoading) {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandPalette.BlueAccessible)
                }
            }
        } else if (state.catalogError != null) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.ErrorOutline,
                    title = tr(lang, "Unable to Load Properties", "بارگذاری ملکیت‌ها ممکن نشد"),
                    body = state.catalogError,
                    ctaLabel = tr(lang, "Retry", "تلاش مجدد"),
                    onCta = { vm.refreshPublicCatalog() }
                )
            }
        } else if (publishedForDeal.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.Apartment,
                    title = tr(lang, "No Listings in This Category", "ملکیتی در این بخش یافت نشد"),
                    body = tr(
                        lang,
                        "No published ${state.homeDealFilter.en.lowercase()} listings are available right now.",
                        "در حال حاضر ملکیت منتشرشده‌ای در بخش ${state.homeDealFilter.da} وجود ندارد."
                    ),
                    ctaLabel = tr(lang, "Browse All Properties", "مشاهده همه ملکیت‌ها"),
                    onCta = {
                        vm.clearAppliedFilters()
                        vm.navigate(AttaieRoute.SEARCH_RESULTS)
                    }
                )
            }
        } else {
            item {
                Text(tr(lang, "Featured Residence", "ملکیت ویژه"), style = MaterialTheme.typography.titleMedium)
            }
            item {
                val featured = publishedForDeal.first()
                PropertyCard(
                    listing = featured,
                    lang = lang,
                    isSaved = featured.id in state.savedIds,
                    onToggleSave = { vm.toggleFavorite(featured.id) },
                    onClick = { vm.openProperty(featured.id) }
                )
            }
            if (publishedForDeal.size > 1) {
                item {
                    Text(tr(lang, "Recommended Properties", "ملکیت‌های پیشنهادی"), style = MaterialTheme.typography.titleMedium)
                }
                items(publishedForDeal.drop(1), key = { it.id }) { prop ->
                    PropertyCard(
                        listing = prop,
                        lang = lang,
                        isSaved = prop.id in state.savedIds,
                        onToggleSave = { vm.toggleFavorite(prop.id) },
                        onClick = { vm.openProperty(prop.id) }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Screen07Search(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val districtSuggestions = if (lang == AppLang.DARI) {
        listOf("وزیر اکبر خان", "شهر نو", "کارته چهار", "تایمنی", "هرات", "مزار شریف")
    } else {
        listOf("Wazir Akbar Khan", "Shahr-e-Naw", "Kart-e-Char", "Taimani", "Herat", "Mazar-i-Sharif")
    }
    val typeSuggestions = listOf("Villa", "Apartment", "House", "Commercial")
    val previewMatches = remember(state.publicListings, state.searchQuery) {
        if (state.searchQuery.isBlank()) state.publicListings.take(2)
        else vm.filteredAndSortedPublicListings(state).take(3)
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Search Properties", "جستجوی ملکیت"), onBack = { vm.navigateBack() })
        Column(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            MinimalField(
                label = tr(lang, "Search city, district, or type", "جستجوی شهر، ناحیه یا نوع ملکیت"),
                value = state.searchQuery,
                onValueChange = { vm.updateSearchQuery(it) },
                imeAction = ImeAction.Search,
                onImeAction = { vm.commitSearch(state.searchQuery) },
                leadingIcon = Icons.Rounded.Search,
                trailingContent = if (state.searchQuery.isNotBlank()) {
                    {
                        IconButton(onClick = { vm.updateSearchQuery("") }) {
                            Icon(Icons.Rounded.Close, contentDescription = tr(lang, "Clear search", "پاک کردن جستجو"))
                        }
                    }
                } else null
            )

            PrimaryGreenButton(text = tr(lang, "Search", "جستجو")) {
                vm.commitSearch(state.searchQuery)
            }

            if (state.recentSearches.isNotEmpty()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(tr(lang, "Recent Searches", "جستجوهای اخیر"), style = MaterialTheme.typography.titleSmall)
                    TextButton(onClick = { vm.clearRecentSearches() }) {
                        Text(tr(lang, "Clear", "پاک کردن"), color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                    }
                }
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    state.recentSearches.forEach { q ->
                        FilterPill(q, false) { vm.commitSearch(q) }
                    }
                }
            }

            Text(tr(lang, "Popular Locations", "ساحات پرطرفدار"), style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                districtSuggestions.forEach { loc ->
                    FilterPill(loc, false) { vm.commitSearch(loc) }
                }
            }

            Text(tr(lang, "Property Types", "انواع ملکیت"), style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                typeSuggestions.forEach { cat ->
                    FilterPill(localizedCategoryLabel(lang, cat), false) {
                        vm.updateDraftFilters { it.copy(category = cat) }
                        vm.applyDraftFilters()
                    }
                }
            }

            if (previewMatches.isNotEmpty()) {
                Text(tr(lang, "Quick Preview", "پیش‌نمایش سریع"), style = MaterialTheme.typography.titleSmall)
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    previewMatches.forEach { prop ->
                        PropertyCard(
                            listing = prop,
                            lang = lang,
                            isSaved = prop.id in state.savedIds,
                            onToggleSave = { vm.toggleFavorite(prop.id) },
                            onClick = { vm.openProperty(prop.id) }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Screen08SearchResults(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val results = remember(state.publicListings, state.searchQuery, state.appliedFilters, state.sortOption) {
        vm.filteredAndSortedPublicListings(state)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AttaieTopBar(
            title = state.searchQuery.ifBlank { tr(lang, "Search Results", "نتایج جستجو") },
            onBack = { vm.navigateBack() },
            trailing = {
                TextButton(onClick = { vm.openAdvancedFilters() }) {
                    Icon(Icons.Rounded.Tune, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text(tr(lang, "Filters", "فلترها"), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        )

        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    tr(lang, "${results.size} Properties Found", "${results.size} ملکیت یافت شد"),
                    style = MaterialTheme.typography.titleSmall,
                    modifier = Modifier.align(Alignment.CenterVertically)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterPill(tr(lang, state.sortOption.en, state.sortOption.da), false) { vm.cycleSortOption() }
                    FilterPill(
                        if (state.resultsListMode) tr(lang, "Map", "نقشه") else tr(lang, "List", "لست"),
                        !state.resultsListMode
                    ) { vm.toggleResultsMode() }
                }
            }

            if (state.isCatalogLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandPalette.BlueAccessible)
                }
            } else if (results.isEmpty()) {
                EmptyStateCard(
                    icon = Icons.Rounded.Search,
                    title = tr(lang, "No Matching Properties", "ملکیتی مطابق جستجو یافت نشد"),
                    body = tr(lang, "Try broadening your search terms or clearing active filters.", "عبارت جستجو را تغییر دهید یا فلترهای فعال را پاک کنید."),
                    ctaLabel = tr(lang, "Clear Filters", "پاک کردن فلترها"),
                    onCta = { vm.clearAppliedFilters() }
                )
            } else if (!state.resultsListMode) {
                // Interactive District Map Preview with Real Pin Selection
                val selectedPin = results.find { it.id == state.selectedMapPropertyId } ?: results.first()
                Surface(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    shape = RoundedCornerShape(22.dp),
                    color = BrandPalette.BlueSoft.copy(alpha = 0.4f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(tr(lang, "District Pins", "موقعیت ساحات"), style = MaterialTheme.typography.titleSmall)
                            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                results.forEach { p ->
                                    FilterPill("${tr(lang, p.districtEn, p.districtDa)} • ${p.priceDisplay}", p.id == selectedPin.id) {
                                        vm.selectMapProperty(p.id)
                                    }
                                }
                            }
                        }
                        Box(modifier = Modifier.align(Alignment.BottomCenter)) {
                            PropertyCard(
                                listing = selectedPin,
                                lang = lang,
                                isSaved = selectedPin.id in state.savedIds,
                                onToggleSave = { vm.toggleFavorite(selectedPin.id) },
                                onClick = { vm.openProperty(selectedPin.id) }
                            )
                        }
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    items(results, key = { it.id }) { prop ->
                        PropertyCard(
                            listing = prop,
                            lang = lang,
                            isSaved = prop.id in state.savedIds,
                            onToggleSave = { vm.toggleFavorite(prop.id) },
                            onClick = { vm.openProperty(prop.id) }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Screen09AdvancedFilters(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val f = state.draftFilters
    val categories = listOf("All", "Villa", "Apartment", "House", "Commercial")

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(
            title = tr(lang, "Advanced Filters", "فلترهای پیشرفته"),
            onBack = { vm.navigateBack() },
            trailing = {
                TextButton(onClick = { vm.clearDraftFilters() }) {
                    Text(tr(lang, "Clear All", "پاک کردن همه"), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }
        )
        Column(
            modifier = Modifier
                .weight(1f)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(tr(lang, "Listing Type", "نوع معامله"), style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterPill(tr(lang, "Any", "همه"), f.dealType == null) { vm.updateDraftFilters { it.copy(dealType = null) } }
                FilterPill(tr(lang, "Buy", "خرید"), f.dealType == DealType.BUY) { vm.updateDraftFilters { it.copy(dealType = DealType.BUY) } }
                FilterPill(tr(lang, "Rent", "کرایه"), f.dealType == DealType.RENT) { vm.updateDraftFilters { it.copy(dealType = DealType.RENT) } }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MinimalField(tr(lang, "City", "شهر"), f.city, { v -> vm.updateDraftFilters { it.copy(city = v) } }, modifier = Modifier.weight(1f))
                MinimalField(tr(lang, "District", "ناحیه"), f.district, { v -> vm.updateDraftFilters { it.copy(district = v) } }, modifier = Modifier.weight(1f))
            }

            Text(tr(lang, "Price Range (USD)", "محدوده قیمت (دالر)"), style = MaterialTheme.typography.titleSmall)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MinimalField(tr(lang, "Min Price", "حداقل قیمت"), f.minPrice, { v -> vm.updateDraftFilters { it.copy(minPrice = v.filter { c -> c.isDigit() }) } }, modifier = Modifier.weight(1f), keyboardType = KeyboardType.Number, forceLtrText = true)
                MinimalField(tr(lang, "Max Price", "حداکثر قیمت"), f.maxPrice, { v -> vm.updateDraftFilters { it.copy(maxPrice = v.filter { c -> c.isDigit() }) } }, modifier = Modifier.weight(1f), keyboardType = KeyboardType.Number, forceLtrText = true)
            }
            if (state.filterRangeError != null) {
                Text(state.filterRangeError, color = MaterialTheme.colorScheme.error, fontSize = 12.sp)
            }

            Text(tr(lang, "Property Category", "کتگوری ملکیت"), style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                categories.forEach { cat ->
                    FilterPill(localizedCategoryLabel(lang, cat), f.category == cat) { vm.updateDraftFilters { it.copy(category = cat) } }
                }
            }

            Text(tr(lang, "Minimum Bedrooms", "حداقل اطاق خواب"), style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(0, 1, 2, 3, 4, 5).forEach { n ->
                    FilterPill(if (n == 0) tr(lang, "Any", "همه") else "$n+", f.minBeds == n) {
                        vm.updateDraftFilters { it.copy(minBeds = n) }
                    }
                }
            }

            Text(tr(lang, "Minimum Bathrooms", "حداقل حمام"), style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(0, 1, 2, 3, 4).forEach { n ->
                    FilterPill(if (n == 0) tr(lang, "Any", "همه") else "$n+", f.minBaths == n) {
                        vm.updateDraftFilters { it.copy(minBaths = n) }
                    }
                }
            }

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MinimalField(tr(lang, "Min Area (sqm)", "حداقل مساحت"), f.minArea, { v -> vm.updateDraftFilters { it.copy(minArea = v.filter { c -> c.isDigit() }) } }, modifier = Modifier.weight(1f), keyboardType = KeyboardType.Number, forceLtrText = true)
                MinimalField(tr(lang, "Floor Number", "شماره منزل"), f.floor, { v -> vm.updateDraftFilters { it.copy(floor = v.filter { c -> c.isDigit() }) } }, modifier = Modifier.weight(1f), keyboardType = KeyboardType.Number, forceLtrText = true, imeAction = ImeAction.Done)
            }
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 6.dp) {
            Box(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(16.dp)) {
                PrimaryGreenButton(text = tr(lang, "Show Results", "نمایش نتایج")) {
                    vm.applyDraftFilters()
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Screen10PropertyDetails(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val context = LocalContext.current
    val prop = state.publicListings.find { it.id == state.selectedPropertyId }
        ?: state.ownerListings.find { it.id == state.selectedPropertyId }

    var showContactDialog by remember(state.selectedPropertyId) { mutableStateOf(false) }
    var buyerName by remember(state.session) { mutableStateOf(state.session?.fullName.orEmpty()) }
    var buyerPhone by remember(state.session) { mutableStateOf(state.session?.phone.orEmpty()) }
    var buyerMessage by remember(state.selectedPropertyId) { mutableStateOf("") }

    if (prop == null) {
        Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
            AttaieTopBar(tr(lang, "Property Details", "جزئیات ملکیت"), onBack = { vm.navigateBack() })
            Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                EmptyStateCard(
                    icon = Icons.Rounded.ErrorOutline,
                    title = tr(lang, "Property Unavailable", "ملکیت در دسترس نیست"),
                    body = tr(lang, "This listing could not be found or is no longer published.", "این ملکیت یافت نشد یا دیگر منتشر نیست."),
                    ctaLabel = tr(lang, "Back to Home", "بازگشت به خانه"),
                    onCta = { vm.navigate(AttaieRoute.HOME, clearBackStack = true) }
                )
            }
        }
        return
    }

    val isSaved = prop.id in state.savedIds

    if (showContactDialog) {
        AlertDialog(
            onDismissRequest = { showContactDialog = false },
            title = { Text(tr(lang, "Contact Seller", "تماس با فروشنده"), fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "${tr(lang, prop.titleEn, prop.titleDa)} • ${prop.priceDisplay}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    MinimalField(tr(lang, "Your Name", "نام شما"), buyerName, { buyerName = it })
                    MinimalField(tr(lang, "Phone Number", "شماره تماس"), buyerPhone, { buyerPhone = it }, keyboardType = KeyboardType.Phone, forceLtrText = true)
                    MinimalField(tr(lang, "Message", "پیام شما"), buyerMessage, { buyerMessage = it }, singleLine = false, imeAction = ImeAction.Done)
                }
            },
            confirmButton = {
                TextButton(
                    enabled = !state.isSendingInquiry,
                    onClick = {
                        vm.sendBuyerInquiry(prop.id, buyerName, buyerPhone, buyerMessage)
                        showContactDialog = false
                        buyerMessage = ""
                    }
                ) {
                    Text(tr(lang, "Send Inquiry", "ارسال پیام"), color = BrandPalette.GreenAccessible, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showContactDialog = false }) {
                    Text(tr(lang, "Cancel", "لغو"))
                }
            }
        )
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            Box(modifier = Modifier.fillMaxWidth().aspectRatio(4f / 3.1f)) {
                PropertyImageFrame(tr(lang, prop.categoryEn, prop.categoryDa), prop.imageUrls.size, Modifier.fillMaxSize())

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .statusBarsPadding()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { vm.navigateBack() },
                        modifier = Modifier
                            .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.94f))
                    ) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = tr(lang, "Go back", "بازگشت"), tint = BrandPalette.Ink)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        IconButton(
                            onClick = {
                                try {
                                    val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                        type = "text/plain"
                                        putExtra(Intent.EXTRA_SUBJECT, tr(lang, prop.titleEn, prop.titleDa))
                                        putExtra(Intent.EXTRA_TEXT, "${tr(lang, prop.titleEn, prop.titleDa)} — ${prop.priceDisplay} (${tr(lang, prop.districtEn, prop.districtDa)})")
                                    }
                                    context.startActivity(Intent.createChooser(shareIntent, tr(lang, "Share Property", "اشتراک‌گذاری ملکیت")))
                                } catch (_: Exception) {
                                    vm.emitMessage(tr(lang, "Unable to open share sheet.", "امکان اشتراک‌گذاری وجود ندارد."))
                                }
                            },
                            modifier = Modifier
                                .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.94f))
                        ) {
                            Icon(Icons.Rounded.Share, contentDescription = tr(lang, "Share property", "اشتراک‌گذاری"), tint = BrandPalette.Ink)
                        }
                        IconButton(
                            onClick = { vm.toggleFavorite(prop.id) },
                            modifier = Modifier
                                .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.94f))
                        ) {
                            Icon(
                                if (isSaved) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder,
                                contentDescription = if (isSaved) tr(lang, "Remove favorite", "حذف از ذخیره‌شده") else tr(lang, "Save property", "ذخیره ملکیت"),
                                tint = if (isSaved) BrandPalette.GreenAccessible else BrandPalette.Ink
                            )
                        }
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(24.dp)
                        .align(Alignment.BottomCenter)
                        .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp))
                        .background(MaterialTheme.colorScheme.surface)
                )
            }

            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                FlowRow(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    StatusPill(tr(lang, prop.dealType.en, prop.dealType.da), BrandPalette.BlueSoft, BrandPalette.BlueAccessible)
                    Text(prop.priceDisplay, style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold))
                }
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(tr(lang, prop.titleEn, prop.titleDa), style = MaterialTheme.typography.headlineMedium)
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Rounded.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                        Text("${tr(lang, prop.districtEn, prop.districtDa)}, ${tr(lang, prop.cityEn, prop.cityDa)}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    DetailSpecTile(Icons.Rounded.SquareFoot, "${prop.areaSqm} ${tr(lang, "sqm", "م²")}", tr(lang, "Area", "مساحت"), Modifier.weight(1f))
                    DetailSpecTile(Icons.Rounded.Bed, "${if (prop.beds == 0) "-" else prop.beds}", tr(lang, "Bedrooms", "اطاق"), Modifier.weight(1f))
                    DetailSpecTile(Icons.Rounded.Bathtub, "${prop.baths}", tr(lang, "Baths", "حمام"), Modifier.weight(1f))
                }
                Text(tr(lang, "Floor: ${prop.floorInfoEn}", "منزل: ${prop.floorInfoDa}"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.7f))
                Text(tr(lang, "Description", "توضیحات"), style = MaterialTheme.typography.titleMedium)
                Text(tr(lang, prop.descriptionEn, prop.descriptionDa), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(tr(lang, "Amenities", "امکانات"), style = MaterialTheme.typography.titleMedium)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    (if (lang == AppLang.DARI) prop.amenitiesDa else prop.amenitiesEn).forEach { am ->
                        StatusPill(am, MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurface)
                    }
                }
                Surface(
                    shape = RoundedCornerShape(18.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
                            Surface(shape = CircleShape, color = BrandPalette.BlueSoft, modifier = Modifier.size(42.dp)) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Rounded.Business, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(20.dp))
                                }
                            }
                            Column {
                                Text(tr(lang, prop.sellerLabelEn, prop.sellerLabelDa), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(tr(lang, "Listed via Attaie Properties", "ثبت‌شده در عطایی پراپرتیز"), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        if (prop.sellerVerified) {
                            Icon(Icons.Rounded.VerifiedUser, contentDescription = tr(lang, "Verified seller", "فروشنده تاییدشده"), tint = BrandPalette.GreenAccessible)
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
            }
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 8.dp) {
            Column {
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.8f))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding()
                        .padding(horizontal = 20.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.spacedBy(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(tr(lang, "Asking Price", "قیمت"), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text(prop.priceDisplay, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold))
                    }
                    PrimaryGreenButton(
                        text = tr(lang, "Contact Seller", "تماس با فروشنده"),
                        modifier = Modifier.weight(1f)
                    ) { showContactDialog = true }
                }
            }
        }
    }
}

@Composable
private fun Screen11SavedProperties(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    var localSearch by remember { mutableStateOf("") }
    val saved = remember(state.publicListings, state.savedIds, localSearch) {
        state.publicListings
            .filter { it.id in state.savedIds }
            .filter { p ->
                localSearch.isBlank() ||
                    p.titleEn.contains(localSearch, ignoreCase = true) ||
                    p.titleDa.contains(localSearch, ignoreCase = true) ||
                    p.districtEn.contains(localSearch, ignoreCase = true) ||
                    p.districtDa.contains(localSearch, ignoreCase = true)
            }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AttaieTopBar(tr(lang, "Saved Properties", "ملکیت‌های ذخیره‌شده"))
        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            MinimalField(
                label = tr(lang, "Search saved listings", "جستجو در ذخیره‌شده‌ها"),
                value = localSearch,
                onValueChange = { localSearch = it },
                leadingIcon = Icons.Rounded.Search,
                imeAction = ImeAction.Search,
                trailingContent = if (localSearch.isNotBlank()) {
                    { IconButton(onClick = { localSearch = "" }) { Icon(Icons.Rounded.Close, contentDescription = tr(lang, "Clear", "پاک کردن")) } }
                } else null
            )
            if (saved.isEmpty()) {
                EmptyStateCard(
                    icon = Icons.Rounded.FavoriteBorder,
                    title = tr(lang, "No Saved Properties", "ملکیت ذخیره‌شده‌ای وجود ندارد"),
                    body = tr(lang, "Save properties you like while exploring to compare them here.", "هنگام جستجو ملکیت‌های دلخواه را ذخیره کنید تا اینجا مقایسه نمایید."),
                    ctaLabel = tr(lang, "Explore Properties", "مشاهده ملکیت‌ها"),
                    onCta = { vm.navigate(AttaieRoute.HOME, clearBackStack = true) }
                )
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
                    items(saved, key = { it.id }) { prop ->
                        PropertyCard(
                            listing = prop,
                            lang = lang,
                            isSaved = true,
                            onToggleSave = { vm.toggleFavorite(prop.id) },
                            onClick = { vm.openProperty(prop.id) }
                        )
                    }
                }
            }
        }
    }
}

// =============================================================================
// 10. SCREENS 12–15: INDIVIDUAL DASHBOARD, MY PROPERTIES, 6-STEP WIZARD & REVIEW
// =============================================================================

@Composable
private fun Screen12CustomerDashboard(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val session = state.session ?: return
    val draftsCount = state.ownerListings.count { it.status == ListingStatus.DRAFT }
    val pendingCount = state.ownerListings.count { it.status == ListingStatus.PENDING }
    val publishedCount = state.ownerListings.count { it.status == ListingStatus.PUBLISHED }

    LazyColumn(
        modifier = Modifier.fillMaxSize().statusBarsPadding(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(tr(lang, "Customer Dashboard", "داشبورد مشتری"), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(session.fullName, style = MaterialTheme.typography.titleLarge)
                        }
                        StatusPill(
                            text = if (session.isVerified) tr(lang, "Verified", "تاییدشده") else tr(lang, "Unverified", "تاییدنشده"),
                            bg = if (session.isVerified) BrandPalette.GreenSoft else BrandPalette.BlueSoft,
                            fg = if (session.isVerified) BrandPalette.GreenAccessible else BrandPalette.BlueAccessible
                        )
                    }
                    PrimaryGreenButton(text = tr(lang, "Add New Property", "ثبت ملکیت جدید")) {
                        vm.startNewListing()
                    }
                }
            }
        }
        item {
            Text(tr(lang, "My Properties Summary", "خلاصه ملکیت‌های من"), style = MaterialTheme.typography.titleMedium)
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile(tr(lang, "Draft", "پیش‌نویس"), draftsCount.toString(), BrandPalette.Gray, Modifier.weight(1f)) {
                    vm.openMyPropertiesWithStatus(ListingStatus.DRAFT)
                }
                MetricTile(tr(lang, "Pending", "در بررسی"), pendingCount.toString(), BrandPalette.BlueAccessible, Modifier.weight(1f)) {
                    vm.openMyPropertiesWithStatus(ListingStatus.PENDING)
                }
                MetricTile(tr(lang, "Published", "منتشرشده"), publishedCount.toString(), BrandPalette.GreenAccessible, Modifier.weight(1f)) {
                    vm.openMyPropertiesWithStatus(ListingStatus.PUBLISHED)
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SecondaryBlueButton(text = tr(lang, "My Properties", "ملکیت‌های من"), modifier = Modifier.weight(1f)) {
                    vm.openMyPropertiesWithStatus(null)
                }
                SecondaryBlueButton(text = tr(lang, "Inquiries", "پیام‌ها"), modifier = Modifier.weight(1f)) {
                    vm.navigate(AttaieRoute.INQUIRIES)
                }
            }
        }
        item {
            Text(tr(lang, "Recent Listing Activity", "فعالیت‌های اخیر اعلانات"), style = MaterialTheme.typography.titleMedium)
        }
        if (state.ownerListings.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Rounded.Add,
                    title = tr(lang, "No Listings Yet", "هنوز اعلانی ثبت نشده"),
                    body = tr(lang, "Submit your first property for review to publish it on Attaie Properties.", "اولین ملکیت خود را برای بررسی و نشر در عطایی پراپرتیز ثبت کنید.")
                )
            }
        } else {
            items(state.ownerListings.take(4), key = { it.id }) { prop ->
                Surface(
                    modifier = Modifier.fillMaxWidth().clickable { vm.openListingReview(prop.id) },
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(tr(lang, prop.titleEn, prop.titleDa), fontWeight = FontWeight.Bold, fontSize = 14.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("${tr(lang, prop.districtEn, prop.districtDa)} • ${prop.submittedDate}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Spacer(Modifier.width(8.dp))
                        ListingStatusBadge(prop.status, lang)
                    }
                }
            }
        }
    }
}

@Composable
private fun Screen13MyProperties(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val tabs = listOf<ListingStatus?>(null) + ListingStatus.entries
    val filtered = remember(state.ownerListings, state.myPropertiesTab) {
        if (state.myPropertiesTab == null) state.ownerListings
        else state.ownerListings.filter { it.status == state.myPropertiesTab }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        AttaieTopBar(
            title = tr(lang, "My Properties", "ملکیت‌های من"),
            onBack = { vm.navigateBack() },
            trailing = {
                TextButton(onClick = { vm.startNewListing() }) {
                    Text("+ ${tr(lang, "Add", "جدید")}", color = BrandPalette.GreenAccessible, fontWeight = FontWeight.Bold)
                }
            }
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            tabs.forEach { tab ->
                val label = if (tab == null) tr(lang, "All", "همه") else tr(lang, tab.en, tab.da)
                FilterPill(label, state.myPropertiesTab == tab) { vm.setMyPropertiesTab(tab) }
            }
        }
        if (filtered.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(20.dp), contentAlignment = Alignment.Center) {
                EmptyStateCard(
                    icon = Icons.Rounded.Apartment,
                    title = tr(lang, "No Properties in This Tab", "ملکیتی در این بخش یافت نشد"),
                    body = tr(lang, "Add a new property or switch tabs to view other listings.", "ملکیت جدید اضافه کنید یا تب دیگری را انتخاب نمایید."),
                    ctaLabel = tr(lang, "Add New Property", "ثبت ملکیت جدید"),
                    onCta = { vm.startNewListing() }
                )
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filtered, key = { it.id }) { prop ->
                    Surface(
                        shape = RoundedCornerShape(18.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                ListingStatusBadge(prop.status, lang)
                                Text(prop.priceDisplay, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Text(tr(lang, prop.titleEn, prop.titleDa), style = MaterialTheme.typography.titleMedium)
                            Text("${tr(lang, prop.districtEn, prop.districtDa)}, ${tr(lang, prop.cityEn, prop.cityDa)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                SecondaryBlueButton(text = tr(lang, "Edit", "ویرایش"), modifier = Modifier.weight(1f)) {
                                    vm.startEditListing(prop.id)
                                }
                                SecondaryBlueButton(text = tr(lang, "Details", "جزئیات"), modifier = Modifier.weight(1f)) {
                                    vm.openProperty(prop.id)
                                }
                                SecondaryBlueButton(text = tr(lang, "Status", "وضعیت"), modifier = Modifier.weight(1f)) {
                                    vm.openListingReview(prop.id)
                                }
                            }
                            if (prop.status == ListingStatus.PUBLISHED) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    val closeStatus = if (prop.dealType == DealType.RENT) ListingStatus.RENTED else ListingStatus.SOLD
                                    TextButton(onClick = { vm.markOwnerListingStatus(prop.id, closeStatus) }) {
                                        Text(
                                            tr(lang, "Mark as ${closeStatus.en}", "تغییر وضعیت به ${closeStatus.da}"),
                                            color = MaterialTheme.colorScheme.primary,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun Screen14AddEditProperty(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val d = state.draft
    val photoPicker = rememberLauncherForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        if (uris.isNotEmpty()) {
            val newList = (d.attachedPhotoUris + uris.map { it.toString() }).distinct().take(12)
            vm.updateDraft { it.copy(attachedPhotoUris = newList) }
        }
    }

    val stepTitle = when (d.step) {
        1 -> tr(lang, "1. Property Information", "۱. معلومات ملکیت")
        2 -> tr(lang, "2. Location", "۲. موقعیت")
        3 -> tr(lang, "3. Pricing", "۳. قیمت‌گذاری")
        4 -> tr(lang, "4. Features & Specifications", "۴. مشخصات")
        5 -> tr(lang, "5. Photos", "۵. تصاویر")
        else -> tr(lang, "6. Review & Submit", "۶. بررسی و ارسال")
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(
            title = if (d.mode == ListingFormMode.CREATE) tr(lang, "Add Property", "ثبت ملکیت") else tr(lang, "Edit Property", "ویرایش ملکیت"),
            onBack = { vm.navigateBack() },
            trailing = {
                TextButton(enabled = !state.isSubmittingListing, onClick = { vm.saveListingDraft() }) {
                    Text(tr(lang, "Save Draft", "ذخیره پیش‌نویس"), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                }
            }
        )
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(stepTitle, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
            LinearProgressIndicator(
                progress = { d.step / 6f },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(50)),
                color = BrandPalette.BlueAccessible,
                trackColor = BrandPalette.BlueSoft
            )
        }
        Column(
            modifier = Modifier
                .weight(1f)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (d.validationError != null) {
                Surface(shape = RoundedCornerShape(12.dp), color = BrandPalette.DangerSoft) {
                    Text(d.validationError, color = BrandPalette.Danger, fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(12.dp))
                }
            }
            when (d.step) {
                1 -> {
                    MinimalField(tr(lang, "Property Title", "عنوان ملکیت"), d.title, { v -> vm.updateDraft { it.copy(title = v) } })
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterPill(tr(lang, "For Sale", "برای فروش"), d.dealType == DealType.BUY) { vm.updateDraft { it.copy(dealType = DealType.BUY) } }
                        FilterPill(tr(lang, "For Rent", "برای کرایه"), d.dealType == DealType.RENT) { vm.updateDraft { it.copy(dealType = DealType.RENT) } }
                    }
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Villa", "Apartment", "House", "Commercial").forEach { c ->
                            FilterPill(localizedCategoryLabel(lang, c), d.category == c) { vm.updateDraft { it.copy(category = c) } }
                        }
                    }
                    MinimalField(tr(lang, "Description", "توضیحات"), d.description, { v -> vm.updateDraft { it.copy(description = v) } }, singleLine = false, imeAction = ImeAction.Done)
                }
                2 -> {
                    MinimalField(tr(lang, "City / Province", "شهر / ولایت"), d.city, { v -> vm.updateDraft { it.copy(city = v) } })
                    MinimalField(tr(lang, "District / Neighborhood", "ناحیه / ساحه"), d.district, { v -> vm.updateDraft { it.copy(district = v) } }, imeAction = ImeAction.Done)
                }
                3 -> {
                    MinimalField(
                        tr(lang, "Asking Price (USD)", "قیمت پیشنهادی (دالر)"),
                        d.priceUsd,
                        { v -> vm.updateDraft { it.copy(priceUsd = v.filter { c -> c.isDigit() }) } },
                        keyboardType = KeyboardType.Number,
                        forceLtrText = true,
                        imeAction = ImeAction.Done
                    )
                }
                4 -> {
                    MinimalField(tr(lang, "Area (sqm)", "مساحت (متر مربع)"), d.areaSqm, { v -> vm.updateDraft { it.copy(areaSqm = v.filter { c -> c.isDigit() }) } }, keyboardType = KeyboardType.Number, forceLtrText = true)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        MinimalField(tr(lang, "Bedrooms", "اطاق"), d.beds, { v -> vm.updateDraft { it.copy(beds = v.filter { c -> c.isDigit() }) } }, modifier = Modifier.weight(1f), keyboardType = KeyboardType.Number, forceLtrText = true)
                        MinimalField(tr(lang, "Bathrooms", "حمام"), d.baths, { v -> vm.updateDraft { it.copy(baths = v.filter { c -> c.isDigit() }) } }, modifier = Modifier.weight(1f), keyboardType = KeyboardType.Number, forceLtrText = true)
                    }
                    MinimalField(tr(lang, "Floor Number", "شماره منزل"), d.floor, { v -> vm.updateDraft { it.copy(floor = v.filter { c -> c.isDigit() }) } }, keyboardType = KeyboardType.Number, forceLtrText = true, imeAction = ImeAction.Done)
                }
                5 -> {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = BrandPalette.BlueSoft.copy(alpha = 0.45f),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f))
                    ) {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(20.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Rounded.PhotoCamera, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(28.dp))
                            Text(
                                tr(lang, "${d.attachedPhotoUris.size} photo(s) selected", "${d.attachedPhotoUris.size} تصویر انتخاب شده"),
                                fontWeight = FontWeight.Bold
                            )
                            SecondaryBlueButton(text = tr(lang, "Select Photos from Device", "انتخاب تصاویر از دستگاه")) {
                                photoPicker.launch("image/*")
                            }
                            if (d.attachedPhotoUris.isNotEmpty()) {
                                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    d.attachedPhotoUris.forEachIndexed { idx, uri ->
                                        Surface(
                                            shape = RoundedCornerShape(50),
                                            color = MaterialTheme.colorScheme.surface,
                                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                                        ) {
                                            Row(
                                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                                            ) {
                                                Text("${tr(lang, "Photo", "تصویر")} ${idx + 1}", fontSize = 11.sp)
                                                Icon(
                                                    Icons.Rounded.Close,
                                                    contentDescription = tr(lang, "Remove photo", "حذف تصویر"),
                                                    modifier = Modifier
                                                        .size(16.dp)
                                                        .clickable {
                                                            vm.updateDraft { it.copy(attachedPhotoUris = it.attachedPhotoUris - uri) }
                                                        }
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else -> {
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = BrandPalette.BlueSoft.copy(alpha = 0.45f),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f))
                    ) {
                        Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(tr(lang, "Review Before Submission", "بررسی پیش از ارسال"), style = MaterialTheme.typography.titleSmall, color = BrandPalette.BlueAccessible)
                            Text(
                                tr(
                                    lang,
                                    "Submitting your listing sends it to the Attaie Properties review queue. Listings are not published automatically.",
                                    "ارسال اعلان آن را به صف بررسی عطایی پراپرتیز می‌فرستد. اعلانات به صورت خودکار منتشر نمی‌شوند."
                                ),
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(d.title.ifBlank { tr(lang, "Untitled Property", "ملکیت بدون عنوان") }, style = MaterialTheme.typography.titleMedium)
                            Text("${tr(lang, d.dealType.en, d.dealType.da)} • ${localizedCategoryLabel(lang, d.category)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary)
                            Text("${d.district}, ${d.city}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(tr(lang, "Price: $${d.priceUsd} • Area: ${d.areaSqm} sqm • ${d.beds} Beds / ${d.baths} Baths", "قیمت: $${d.priceUsd} • مساحت: ${d.areaSqm} م² • ${d.beds} اطاق / ${d.baths} حمام"), fontSize = 12.sp)
                            Text(tr(lang, "Attached photos: ${d.attachedPhotoUris.size}", "تصاویر ضمیمه‌شده: ${d.attachedPhotoUris.size}"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 6.dp) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (d.step > 1) {
                    SecondaryBlueButton(
                        text = tr(lang, "Back", "قبلی"),
                        modifier = Modifier.weight(0.9f)
                    ) {
                        vm.updateDraft { it.copy(step = (it.step - 1).coerceAtLeast(1)) }
                    }
                }
                if (d.step < 6) {
                    PrimaryGreenButton(
                        text = tr(lang, "Continue", "ادامه"),
                        modifier = Modifier.weight(1.2f)
                    ) { vm.advanceDraftStep() }
                } else {
                    PrimaryGreenButton(
                        text = tr(lang, "Submit for Review", "ارسال برای بررسی"),
                        loading = state.isSubmittingListing,
                        modifier = Modifier.weight(1.2f)
                    ) { vm.submitListing() }
                }
            }
        }
    }
}

@Composable
private fun Screen15ListingReviewStatus(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val prop = state.ownerListings.find { it.id == state.selectedReviewListingId }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Listing Review Status", "وضعیت بررسی اعلان"), onBack = { vm.navigateBack() })
        if (prop == null) {
            Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                EmptyStateCard(
                    icon = Icons.Rounded.ErrorOutline,
                    title = tr(lang, "Listing Not Found", "اعلان یافت نشد"),
                    body = tr(lang, "Select one of your properties to inspect its review status.", "یکی از ملکیت‌های خود را برای مشاهده وضعیت بررسی انتخاب کنید."),
                    ctaLabel = tr(lang, "My Properties", "ملکیت‌های من"),
                    onCta = { vm.navigate(AttaieRoute.MY_PROPERTIES) }
                )
            }
            return
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        ListingStatusBadge(prop.status, lang)
                        Text(prop.priceDisplay, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    Text(tr(lang, prop.titleEn, prop.titleDa), style = MaterialTheme.typography.titleMedium)
                    Text("${tr(lang, prop.districtEn, prop.districtDa)}, ${tr(lang, prop.cityEn, prop.cityDa)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(tr(lang, "Submitted: ${prop.submittedDate}", "تاریخ ارسال: ${prop.submittedDate}"), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = BrandPalette.BlueSoft.copy(alpha = 0.45f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f))
            ) {
                Row(modifier = Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Info, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(20.dp))
                    Text(
                        tr(
                            lang,
                            "Submitting a listing places it in moderation review. Publication only occurs after approval.",
                            "ارسال اعلان آن را در صف بررسی قرار می‌دهد. نشر ملکیت تنها پس از تایید انجام می‌شود."
                        ),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            if (prop.status == ListingStatus.REJECTED) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = BrandPalette.DangerSoft,
                    border = BorderStroke(1.dp, BrandPalette.Danger.copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(tr(lang, "Review Feedback", "دلیل رد اعلان"), fontWeight = FontWeight.Bold, color = BrandPalette.Danger, fontSize = 13.sp)
                        Text(
                            text = tr(
                                lang,
                                prop.rejectionNoteEn ?: "Additional documentation or clearer property details are required.",
                                prop.rejectionNoteDa ?: "مدارک بیشتر یا جزئیات دقیق‌تر ملکیت مورد نیاز است."
                            ),
                            fontSize = 12.sp,
                            color = BrandPalette.Danger
                        )
                    }
                }
                PrimaryGreenButton(text = tr(lang, "Edit & Resubmit", "ویرایش و ارسال مجدد")) {
                    vm.startEditListing(prop.id, isResubmit = true)
                }
            } else if (prop.status == ListingStatus.DRAFT) {
                PrimaryGreenButton(text = tr(lang, "Continue Editing Draft", "ادامه ویرایش پیش‌نویس")) {
                    vm.startEditListing(prop.id, isResubmit = false)
                }
            } else if (prop.status == ListingStatus.PUBLISHED) {
                PrimaryGreenButton(text = tr(lang, "View Public Listing", "مشاهده اعلان منتشرشده")) {
                    vm.openProperty(prop.id)
                }
            }

            SecondaryBlueButton(text = tr(lang, "Back to My Properties", "بازگشت به ملکیت‌های من")) {
                vm.navigate(AttaieRoute.MY_PROPERTIES)
            }
        }
    }
}

// =============================================================================
// 11. SCREENS 16–20: REAL ESTATE AGENCY REGISTRATION & VERIFICATION FLOW
// =============================================================================

@Composable
private fun Screen16AgencyRegistration(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val app = state.agencyApp

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Agency Registration", "ثبت رهنمای معاملات"), onBack = { vm.navigateBack() })
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(tr(lang, "Step 1 of 3 • Business Details", "مرحله ۱ از ۳ • مشخصات شرکت"), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
            LinearProgressIndicator(
                progress = { 1f / 3f },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(50)),
                color = BrandPalette.BlueAccessible,
                trackColor = BrandPalette.BlueSoft
            )
        }
        Column(
            modifier = Modifier
                .weight(1f)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (app.validationError != null) {
                Surface(shape = RoundedCornerShape(12.dp), color = BrandPalette.DangerSoft) {
                    Text(app.validationError, color = BrandPalette.Danger, fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(12.dp))
                }
            }
            MinimalField(tr(lang, "Agency Business Name", "نام رهنمای معاملات"), app.businessName, { v -> vm.updateAgencyApp { it.copy(businessName = v) } }, leadingIcon = Icons.Rounded.Business)
            MinimalField(tr(lang, "Registration Number", "شماره ثبت / جواز"), app.registrationNo, { v -> vm.updateAgencyApp { it.copy(registrationNo = v) } }, forceLtrText = true)
            MinimalField(tr(lang, "Business Address", "آدرس دفتر"), app.businessAddress, { v -> vm.updateAgencyApp { it.copy(businessAddress = v) } }, leadingIcon = Icons.Rounded.LocationOn)
            MinimalField(tr(lang, "Official Representative Name", "نام نماینده رسمی"), app.representativeName, { v -> vm.updateAgencyApp { it.copy(representativeName = v) } }, leadingIcon = Icons.Rounded.Person)
            MinimalField(tr(lang, "Business Details & Service Areas", "توضیحات فعالیت و ساحات کاری"), app.businessDetails, { v -> vm.updateAgencyApp { it.copy(businessDetails = v) } }, singleLine = false, imeAction = ImeAction.Done)
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 6.dp) {
            Box(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(20.dp)) {
                PrimaryGreenButton(text = tr(lang, "Save and Continue", "ذخیره و ادامه")) {
                    vm.validateAndContinueAgencyRegistration()
                }
            }
        }
    }
}

@Composable
private fun Screen17AgencyContacts(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val app = state.agencyApp
    val ownerContact = app.ownerVerifiedContact.ifBlank {
        listOfNotNull(state.session?.email, state.session?.phone).joinToString(" • ")
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Agency Business Contacts", "معلومات تماس رهنمای معاملات"), onBack = { vm.navigateBack() })
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(tr(lang, "Step 2 of 3 • Official Contacts", "مرحله ۲ از ۳ • تماس رسمی دفتر"), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
            LinearProgressIndicator(
                progress = { 2f / 3f },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(50)),
                color = BrandPalette.BlueAccessible,
                trackColor = BrandPalette.BlueSoft
            )
        }
        Column(
            modifier = Modifier
                .weight(1f)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = BrandPalette.GreenSoft,
                border = BorderStroke(1.dp, BrandPalette.GreenAccessible.copy(alpha = 0.25f))
            ) {
                Row(modifier = Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.VerifiedUser, contentDescription = null, tint = BrandPalette.GreenAccessible, modifier = Modifier.size(20.dp))
                    Column {
                        Text(tr(lang, "Account Owner Contact (Separate)", "تماس مالک حساب (جداگانه)"), fontWeight = FontWeight.Bold, fontSize = 12.sp, color = BrandPalette.GreenAccessible)
                        Text(ownerContact.ifBlank { tr(lang, "Linked to your signed-in account", "متصل به حساب کاربری شما") }, fontSize = 12.sp, color = BrandPalette.Ink)
                    }
                }
            }
            Text(
                tr(
                    lang,
                    "Provide your agency's official public business email and phone number. These remain distinct from the account owner's verified contact.",
                    "ایمیل و شماره تماس رسمی دفتر رهنمای معاملات را وارد کنید. این معلومات جدا از تماس شخصی مالک حساب نگهداری می‌شود."
                ),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            if (app.validationError != null) {
                Surface(shape = RoundedCornerShape(12.dp), color = BrandPalette.DangerSoft) {
                    Text(app.validationError, color = BrandPalette.Danger, fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(12.dp))
                }
            }
            MinimalField(tr(lang, "Agency Business Email", "ایمیل رسمی دفتر"), app.businessEmail, { v -> vm.updateAgencyApp { it.copy(businessEmail = v) } }, forceLtrText = true, keyboardType = KeyboardType.Email, leadingIcon = Icons.Rounded.Email)
            MinimalField(tr(lang, "Agency Business Phone", "شماره تماس رسمی دفتر"), app.businessPhone, { v -> vm.updateAgencyApp { it.copy(businessPhone = v) } }, forceLtrText = true, keyboardType = KeyboardType.Phone, leadingIcon = Icons.Rounded.Phone, imeAction = ImeAction.Done)
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 6.dp) {
            Box(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(20.dp)) {
                PrimaryGreenButton(text = tr(lang, "Continue", "ادامه")) {
                    vm.validateAndContinueAgencyContacts()
                }
            }
        }
    }
}

@Composable
private fun Screen18AgencyDocuments(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val app = state.agencyApp

    val regPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val name = uri.lastPathSegment?.substringAfterLast('/') ?: "registration_document.pdf"
            vm.uploadAgencyDoc(isRegistrationDoc = true, fileName = name)
        }
    }
    val licensePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val name = uri.lastPathSegment?.substringAfterLast('/') ?: "agency_license.pdf"
            vm.uploadAgencyDoc(isRegistrationDoc = false, fileName = name)
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Agency Document Upload", "آپلود اسناد رهنمای معاملات"), onBack = { vm.navigateBack() })
        Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(tr(lang, "Step 3 of 3 • Verification Documents", "مرحله ۳ از ۳ • اسناد تایید"), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
            LinearProgressIndicator(
                progress = { 1f },
                modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(50)),
                color = BrandPalette.BlueAccessible,
                trackColor = BrandPalette.BlueSoft
            )
        }
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                tr(lang, "Upload clear copies of your business registration and valid real estate agency license (PDF, JPG, or PNG).", "کاپی واضح سند ثبت شرکت و جواز معتبر رهنمای معاملات را آپلود کنید (PDF, JPG یا PNG)."),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            AgencyDocumentUploadCard(
                title = tr(lang, "Business Registration Document", "سند ثبت شرکت"),
                fileName = app.registrationDocName,
                uploadState = app.registrationUploadState,
                progress = app.registrationUploadProgress,
                lang = lang,
                onPick = { regPicker.launch(arrayOf("application/pdf", "image/*")) }
            )
            AgencyDocumentUploadCard(
                title = tr(lang, "Real Estate Agency License", "جواز رهنمای معاملات"),
                fileName = app.licenseDocName,
                uploadState = app.licenseUploadState,
                progress = app.licenseUploadProgress,
                lang = lang,
                onPick = { licensePicker.launch(arrayOf("application/pdf", "image/*")) }
            )
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 6.dp) {
            Box(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(20.dp)) {
                PrimaryGreenButton(
                    text = tr(lang, "Submit Application", "ارسال درخواست"),
                    enabled = !app.isAnyUploadInProgress && app.areRequiredDocsUploaded,
                    loading = state.isSubmittingAgency
                ) { vm.submitAgency() }
            }
        }
    }
}

@Composable
private fun Screen19AgencyStatus(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val app = state.agencyApp
    val (bg, fg) = when (app.status) {
        AgencyStatus.APPROVED -> BrandPalette.GreenSoft to BrandPalette.GreenAccessible
        AgencyStatus.PENDING_REVIEW -> BrandPalette.BlueSoft to BrandPalette.BlueAccessible
        AgencyStatus.REJECTED -> BrandPalette.DangerSoft to BrandPalette.Danger
        AgencyStatus.DRAFT -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(
            title = tr(lang, "Agency Verification Status", "وضعیت تایید رهنمای معاملات"),
            onBack = { vm.navigateBack() },
            trailing = {
                IconButton(onClick = { vm.refreshAgencyStatus() }) {
                    Icon(Icons.Rounded.Refresh, contentDescription = tr(lang, "Refresh status", "به‌روزرسانی وضعیت"))
                }
            }
        )
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    StatusPill(tr(lang, app.status.en, app.status.da), bg, fg)
                    Text(
                        app.businessName.ifBlank { tr(lang, "Agency Application", "درخواست رهنمای معاملات") },
                        style = MaterialTheme.typography.titleLarge
                    )
                    if (app.registrationNo.isNotBlank()) {
                        Text(tr(lang, "Registration: ${app.registrationNo}", "شماره ثبت: ${app.registrationNo}"), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (app.businessAddress.isNotBlank()) {
                        Text(app.businessAddress, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }

            Surface(
                shape = RoundedCornerShape(16.dp),
                color = BrandPalette.BlueSoft.copy(alpha = 0.45f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.35f))
            ) {
                Row(modifier = Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Info, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(20.dp))
                    Text(
                        tr(
                            lang,
                            "Verification status is controlled by Attaie Properties review. Agency approval does not automatically publish property listings.",
                            "وضعیت تایید توسط تیم بررسی عطایی پراپرتیز تعیین می‌شود. تایید رهنمای معاملات به معنای نشر خودکار اعلانات نیست."
                        ),
                        fontSize = 12.sp
                    )
                }
            }

            if (app.status == AgencyStatus.REJECTED && app.rejectionReasonEn.isNotBlank()) {
                Surface(shape = RoundedCornerShape(16.dp), color = BrandPalette.DangerSoft) {
                    Text(
                        tr(lang, app.rejectionReasonEn, app.rejectionReasonDa.ifBlank { app.rejectionReasonEn }),
                        color = BrandPalette.Danger,
                        fontSize = 12.sp,
                        modifier = Modifier.fillMaxWidth().padding(14.dp)
                    )
                }
            }

            if (app.history.isNotEmpty()) {
                Text(tr(lang, "Submission History", "تاریخچه ارسال‌ها"), style = MaterialTheme.typography.titleSmall)
                app.history.forEach { entry ->
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(modifier = Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(tr(lang, "Revision #${entry.version}", "نسخه #${entry.version}"), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                Text(entry.dateLabel, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            Text(tr(lang, entry.noteEn, entry.noteDa), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }

            when (app.status) {
                AgencyStatus.DRAFT -> PrimaryGreenButton(text = tr(lang, "Resume Draft Application", "ادامه درخواست پیش‌نویس")) {
                    vm.navigate(AttaieRoute.AGENCY_REGISTRATION)
                }
                AgencyStatus.REJECTED -> PrimaryGreenButton(text = tr(lang, "Correct & Resubmit", "اصلاح و ارسال مجدد")) {
                    vm.navigate(AttaieRoute.AGENCY_CORRECTION)
                }
                AgencyStatus.APPROVED -> PrimaryGreenButton(text = tr(lang, "Go to Dashboard", "ورود به داشبورد")) {
                    vm.navigate(AttaieRoute.DASHBOARD)
                }
                AgencyStatus.PENDING_REVIEW -> SecondaryBlueButton(text = tr(lang, "Refresh Review Status", "به‌روزرسانی وضعیت بررسی")) {
                    vm.refreshAgencyStatus()
                }
            }
        }
    }
}

@Composable
private fun Screen20AgencyCorrection(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val app = state.agencyApp

    val regPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val name = uri.lastPathSegment?.substringAfterLast('/') ?: "updated_registration.pdf"
            vm.uploadAgencyDoc(isRegistrationDoc = true, fileName = name)
        }
    }
    val licensePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val name = uri.lastPathSegment?.substringAfterLast('/') ?: "updated_license.pdf"
            vm.uploadAgencyDoc(isRegistrationDoc = false, fileName = name)
        }
    }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Correction & Resubmission", "اصلاح و ارسال مجدد"), onBack = { vm.navigateBack() })
        Column(
            modifier = Modifier
                .weight(1f)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = BrandPalette.DangerSoft,
                border = BorderStroke(1.dp, BrandPalette.Danger.copy(alpha = 0.25f))
            ) {
                Column(modifier = Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(tr(lang, "Items Requiring Attention", "موارد نیازمند اصلاح"), fontWeight = FontWeight.Bold, color = BrandPalette.Danger, fontSize = 13.sp)
                    Text(
                        tr(
                            lang,
                            app.rejectionReasonEn.ifBlank { "Please verify your business details and upload updated legible documents." },
                            app.rejectionReasonDa.ifBlank { "لطفاً مشخصات شرکت را بررسی کرده و اسناد خوانا و به‌روز آپلود نمایید." }
                        ),
                        fontSize = 12.sp,
                        color = BrandPalette.Danger
                    )
                }
            }
            MinimalField(tr(lang, "Agency Business Name", "نام رهنمای معاملات"), app.businessName, { v -> vm.updateAgencyApp { it.copy(businessName = v) } })
            MinimalField(tr(lang, "Business Address", "آدرس دفتر"), app.businessAddress, { v -> vm.updateAgencyApp { it.copy(businessAddress = v) } })
            AgencyDocumentUploadCard(
                title = tr(lang, "Registration Document", "سند ثبت شرکت"),
                fileName = app.registrationDocName,
                uploadState = app.registrationUploadState,
                progress = app.registrationUploadProgress,
                lang = lang,
                onPick = { regPicker.launch(arrayOf("application/pdf", "image/*")) }
            )
            AgencyDocumentUploadCard(
                title = tr(lang, "Agency License Document", "جواز رهنمای معاملات"),
                fileName = app.licenseDocName,
                uploadState = app.licenseUploadState,
                progress = app.licenseUploadProgress,
                lang = lang,
                onPick = { licensePicker.launch(arrayOf("application/pdf", "image/*")) }
            )
        }
        Surface(color = MaterialTheme.colorScheme.surface, shadowElevation = 6.dp) {
            Box(modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(20.dp)) {
                PrimaryGreenButton(
                    text = tr(lang, "Resubmit Application", "ارسال مجدد درخواست"),
                    enabled = !app.isAnyUploadInProgress && app.areRequiredDocsUploaded,
                    loading = state.isSubmittingAgency
                ) { vm.submitAgency() }
            }
        }
    }
}

// =============================================================================
// 12. SCREENS 21–24: INQUIRIES, NOTIFICATIONS & PROFILE
// =============================================================================

@Composable
private fun Screen21Inquiries(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language

    Column(modifier = Modifier.fillMaxSize()) {
        AttaieTopBar(tr(lang, "Inquiries", "درخواست‌ها و پیام‌ها"), onBack = { vm.navigateBack() })
        Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Surface(
                shape = RoundedCornerShape(14.dp),
                color = BrandPalette.BlueSoft,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f))
            ) {
                Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Schedule, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(18.dp))
                    Text(
                        tr(lang, "Planned Feature Preview — Connect your messaging backend to receive live customer inquiries.", "پیش‌نمایش قابلیت برنامه‌ریزی‌شده — پس از اتصال سرور پیام‌رسان، درخواست‌های زنده نمایش داده می‌شوند."),
                        fontSize = 11.sp,
                        color = BrandPalette.BlueAccessible
                    )
                }
            }

            if (state.inquiries.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    EmptyStateCard(
                        icon = Icons.Rounded.Send,
                        title = tr(lang, "No Inquiries Yet", "هنوز درخواستی ثبت نشده"),
                        body = tr(lang, "When customers contact you about a published property, their inquiries will appear here.", "هنگامی که مشتریان درباره ملکیت‌های شما پیام بفرستند، اینجا نمایش داده می‌شوند.")
                    )
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 16.dp)) {
                    items(state.inquiries, key = { it.id }) { inq ->
                        val prop = state.ownerListings.find { it.id == inq.propertyId }
                            ?: state.publicListings.find { it.id == inq.propertyId }
                        Surface(
                            modifier = Modifier.fillMaxWidth().clickable { vm.openInquiry(inq.id) },
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surface,
                            border = BorderStroke(1.dp, if (inq.unread) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Text(tr(lang, inq.customerLabelEn, inq.customerLabelDa), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        if (inq.unread) {
                                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(BrandPalette.BlueAccessible))
                                        }
                                    }
                                    if (prop != null) {
                                        Text(
                                            tr(lang, prop.titleEn, prop.titleDa),
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = MaterialTheme.colorScheme.primary,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                    Text(
                                        tr(lang, inq.messageEn, inq.messageDa),
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(inq.dateLabel, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Screen22InquiryDetails(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val context = LocalContext.current
    val inq = state.inquiries.find { it.id == state.selectedInquiryId }
    var replyText by remember(state.selectedInquiryId) { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surface)) {
        AttaieTopBar(tr(lang, "Inquiry Details", "جزئیات درخواست"), onBack = { vm.navigateBack() })
        if (inq == null) {
            Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                EmptyStateCard(
                    icon = Icons.Rounded.ErrorOutline,
                    title = tr(lang, "Inquiry Not Found", "پیام یافت نشد"),
                    body = tr(lang, "Select an inquiry from your inbox.", "لطفاً یک پیام را از صندوق ورودی انتخاب کنید."),
                    ctaLabel = tr(lang, "Back to Inquiries", "بازگشت به پیام‌ها"),
                    onCta = { vm.navigateBack() }
                )
            }
            return
        }
        val linkedProperty = state.ownerListings.find { it.id == inq.propertyId } ?: state.publicListings.find { it.id == inq.propertyId }
        Column(modifier = Modifier.verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            StatusPill(tr(lang, inq.statusEn, inq.statusDa), BrandPalette.BlueSoft, BrandPalette.BlueAccessible)
            if (linkedProperty != null) {
                Surface(
                    modifier = Modifier.fillMaxWidth().clickable { vm.openProperty(linkedProperty.id) },
                    shape = RoundedCornerShape(14.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                ) {
                    Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(tr(lang, linkedProperty.titleEn, linkedProperty.titleDa), fontWeight = FontWeight.Bold, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("${tr(lang, linkedProperty.districtEn, linkedProperty.districtDa)} • ${linkedProperty.priceDisplay}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Icon(Icons.AutoMirrored.Rounded.KeyboardArrowRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            Text(tr(lang, inq.customerLabelEn, inq.customerLabelDa), style = MaterialTheme.typography.titleLarge)
            Text(inq.dateLabel, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.surfaceVariant, border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)) {
                Text(tr(lang, inq.messageEn, inq.messageDa), modifier = Modifier.padding(14.dp), fontSize = 13.sp, lineHeight = 20.sp)
            }
            SecondaryBlueButton(text = tr(lang, "Open Phone Dialer", "تماس تلفنی")) {
                try {
                    val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:"))
                    context.startActivity(dialIntent)
                } catch (_: Exception) {
                    vm.emitMessage(tr(lang, "No dialer app available.", "برنامه تماس در دسترس نیست."))
                }
            }
            MinimalField(tr(lang, "Write Reply", "پاسخ خود را بنویسید"), replyText, { replyText = it }, singleLine = false, imeAction = ImeAction.Done)
            PrimaryGreenButton(text = tr(lang, "Send Reply", "ارسال پاسخ"), enabled = replyText.isNotBlank()) {
                vm.sendInquiryReply(inq.id, replyText)
                replyText = ""
            }
        }
    }
}

@Composable
private fun Screen23Notifications(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language

    Column(modifier = Modifier.fillMaxSize()) {
        AttaieTopBar(
            title = tr(lang, "Notifications", "اعلان‌ها"),
            onBack = { vm.navigateBack() },
            trailing = {
                TextButton(onClick = { vm.navigate(AttaieRoute.PROFILE) }) {
                    Text(tr(lang, "Settings", "تنظیمات"), color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        )
        if (state.notifications.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
                EmptyStateCard(
                    icon = Icons.Rounded.Notifications,
                    title = tr(lang, "All Caught Up", "اعلان جدیدی وجود ندارد"),
                    body = tr(lang, "Updates about agency verification, property reviews, and inquiries will appear here.", "به‌روزرسانی‌های مربوط به تایید رهنما، بررسی ملکیت‌ها و پیام‌ها اینجا نمایش داده می‌شوند.")
                )
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(state.notifications, key = { it.id }) { notif ->
                    Surface(
                        modifier = Modifier.fillMaxWidth().clickable { vm.openNotification(notif) },
                        shape = RoundedCornerShape(16.dp),
                        color = MaterialTheme.colorScheme.surface,
                        border = BorderStroke(1.dp, if (notif.unread) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline)
                    ) {
                        Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text(tr(lang, notif.titleEn, notif.titleDa), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(tr(lang, notif.bodyEn, notif.bodyDa), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(notif.timeLabel, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            if (notif.unread) {
                                Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(BrandPalette.BlueAccessible))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Screen24ProfileSettings(state: AttaieAppState, vm: AttaieAppViewModel) {
    val lang = state.language
    val session = state.session
    var showEditDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showSupportDialog by remember { mutableStateOf(false) }
    var editName by remember(session) { mutableStateOf(session?.fullName.orEmpty()) }
    var editEmail by remember(session) { mutableStateOf(session?.email.orEmpty()) }
    var editPhone by remember(session) { mutableStateOf(session?.phone.orEmpty()) }

    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text(tr(lang, "Privacy & Security", "حریم خصوصی و امنیت"), fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    tr(
                        lang,
                        "Your session tokens, agency documents, and contact details are transmitted over encrypted HTTPS connections when connected to your Attaie Properties backend.",
                        "معلومات حساب، اسناد رهنمای معاملات و شماره تماس شما از طریق اتصال امن رمزگذاری‌شده محافظت می‌شود."
                    ),
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                TextButton(onClick = { showPrivacyDialog = false }) {
                    Text(tr(lang, "Close", "بستن"), color = BrandPalette.BlueAccessible, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    if (showSupportDialog) {
        AlertDialog(
            onDismissRequest = { showSupportDialog = false },
            title = { Text(tr(lang, "Help & Support", "راهنما و پشتیبانی"), fontWeight = FontWeight.Bold) },
            text = {
                Text(
                    tr(
                        lang,
                        "Attaie Properties Support — Gateway of Transparent Dealings. For account verification or listing review questions, contact your official support channel.",
                        "پشتیبانی عطایی پراپرتیز — دروازه معاملات شفاف. برای پرسش درباره تایید حساب یا بررسی اعلانات با بخش پشتیبانی رسمی تماس بگیرید."
                    ),
                    fontSize = 13.sp
                )
            },
            confirmButton = {
                TextButton(onClick = { showSupportDialog = false }) {
                    Text(tr(lang, "Close", "بستن"), color = BrandPalette.BlueAccessible, fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    if (showEditDialog && session != null) {
        AlertDialog(
            onDismissRequest = { showEditDialog = false },
            title = { Text(tr(lang, "Edit Profile", "ویرایش پروفایل"), fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    MinimalField(tr(lang, "Full Name", "نام و تخلص"), editName, { editName = it })
                    MinimalField(tr(lang, "Email", "ایمیل"), editEmail, { editEmail = it }, keyboardType = KeyboardType.Email, forceLtrText = true)
                    MinimalField(tr(lang, "Phone", "شماره تماس"), editPhone, { editPhone = it }, keyboardType = KeyboardType.Phone, forceLtrText = true, imeAction = ImeAction.Done)
                }
            },
            confirmButton = {
                TextButton(onClick = { vm.updateProfile(editName, editEmail, editPhone); showEditDialog = false }) {
                    Text(tr(lang, "Save", "ذخیره"), color = BrandPalette.GreenAccessible, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditDialog = false }) { Text(tr(lang, "Cancel", "لغو")) }
            }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().statusBarsPadding(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Surface(shape = CircleShape, color = BrandPalette.BlueSoft, modifier = Modifier.size(54.dp)) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Rounded.Person, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(28.dp))
                        }
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text(session?.fullName ?: tr(lang, "Guest User", "کاربر مهمان"), style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = if (session != null) {
                                "${if (session.accountType == AccountType.AGENCY) tr(lang, "Agency Account", "حساب رهنمای معاملات") else tr(lang, "Individual Account", "حساب انفرادی")} • ${if (session.isVerified) tr(lang, "Verified", "تاییدشده") else tr(lang, "Unverified", "تاییدنشده")}"
                            } else {
                                tr(lang, "Sign in to sync saved homes & listings", "برای همگام‌سازی وارد حساب شوید")
                            },
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        if (session != null) {
            item { SettingsRow(Icons.Rounded.Edit, tr(lang, "Edit Profile", "ویرایش پروفایل")) { showEditDialog = true } }
            if (session.accountType == AccountType.AGENCY) {
                item { SettingsRow(Icons.Rounded.Business, tr(lang, "Agency Profile & Status", "پروفایل و وضعیت رهنمای معاملات")) { vm.navigate(AttaieRoute.AGENCY_STATUS) } }
            }
        } else {
            item {
                PrimaryGreenButton(text = tr(lang, "Sign In / Create Account", "ورود / ایجاد حساب")) {
                    vm.navigate(AttaieRoute.LOGIN)
                }
            }
        }
        item {
            SettingsRow(Icons.Rounded.Language, "${tr(lang, "Language:", "زبان:")} ${lang.label}") { vm.toggleLanguage() }
        }
        item {
            Surface(
                modifier = Modifier.fillMaxWidth().sizeIn(minHeight = 56.dp),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Surface(shape = RoundedCornerShape(10.dp), color = BrandPalette.BlueSoft, modifier = Modifier.size(36.dp)) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Rounded.Notifications, contentDescription = null, tint = BrandPalette.BlueAccessible, modifier = Modifier.size(18.dp))
                            }
                        }
                        Text(tr(lang, "Push Notifications", "اعلان‌های برنامه"), style = MaterialTheme.typography.titleSmall)
                    }
                    Switch(checked = state.notificationsEnabled, onCheckedChange = { vm.setNotificationsEnabled(it) })
                }
            }
        }
        item {
            SettingsRow(Icons.Rounded.Security, tr(lang, "Privacy and Security", "حریم خصوصی و امنیت")) {
                showPrivacyDialog = true
            }
        }
        item {
            SettingsRow(Icons.Rounded.HelpOutline, tr(lang, "Help and Support", "راهنما و پشتیبانی")) {
                showSupportDialog = true
            }
        }
        if (session != null) {
            item {
                Spacer(Modifier.height(4.dp))
                OutlinedButton(
                    onClick = { vm.logout() },
                    modifier = Modifier.fillMaxWidth().sizeIn(minHeight = 50.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, BrandPalette.Danger.copy(alpha = 0.6f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandPalette.Danger)
                ) {
                    Icon(Icons.AutoMirrored.Rounded.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(tr(lang, "Log Out", "خروج از حساب"), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// =============================================================================
// 13. ANDROID STUDIO PREVIEWS (ISOLATED PREVIEW REPOSITORY)
// =============================================================================

@Preview(name = "Attaie V2 — Welcome (English)", showSystemUi = true)
@Composable
private fun PreviewAttaieV2Welcome() {
    val vm = remember { AttaieAppViewModel(PreviewAttaieRepository()) }
    AttaiePropertiesV2App(viewModel = vm)
}

@Preview(name = "Attaie V2 — Home (Dari RTL)", showSystemUi = true)
@Composable
private fun PreviewAttaieV2HomeDari() {
    val vm = remember {
        AttaieAppViewModel(PreviewAttaieRepository()).apply {
            toggleLanguage()
            navigate(AttaieRoute.HOME, clearBackStack = true)
        }
    }
    AttaiePropertiesV2App(viewModel = vm)
}

@Preview(name = "Attaie V2 — Authenticated Dashboard (Dark)", showSystemUi = true, uiMode = Configuration.UI_MODE_NIGHT_YES)
@Composable
private fun PreviewAttaieV2Dark() {
    val session = AuthSession(
        userId = "preview-user",
        sessionToken = "preview-token",
        fullName = "Ahmad Sample",
        email = "ahmad.sample@example.af",
        phone = "+93 70 000 0000",
        accountType = AccountType.INDIVIDUAL,
        isVerified = true
    )
    val vm = remember {
        AttaieAppViewModel(PreviewAttaieRepository(), initialSession = session).apply {
            navigate(AttaieRoute.DASHBOARD, clearBackStack = true)
        }
    }
    AttaiePropertiesV2App(viewModel = vm)
}