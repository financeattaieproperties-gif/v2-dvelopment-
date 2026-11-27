<?php
require_once __DIR__ . '/bootstrap.php';
cors();
init_secure_session();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'POST only'], 405);
}

$b       = body();
$idToken = trim((string) ($b['idToken'] ?? ''));
$user    = trim((string) ($b['username'] ?? ''));
$pass    = trim((string) ($b['password'] ?? ''));

$authenticated = false;
$authActor = $user;

// 1. Optional Firebase Authentication ID-token sign-in (Google / Firebase Auth)
if ($idToken !== '') {
    $verifierPath = dirname(__DIR__, 2) . '/staff-service/src/FirebaseAuth.php';
    if (!is_file($verifierPath)) {
        json_out(['error' => 'Firebase verification module not found on server'], 503);
    }
    require_once $verifierPath;

    $projectId = ctc_env('FIREBASE_PROJECT_ID', 'attaiepropertieswebsite');
    $apiKey    = ctc_env('FIREBASE_API_KEY', ctc_env('VITE_STAFF_FIREBASE_API_KEY', ''));

    // Fallback to root firebase-applet-config.json when server env vars are not set
    if ($apiKey === '') {
        $configJsonPath = dirname(__DIR__, 2) . '/firebase-applet-config.json';
        if (is_file($configJsonPath)) {
            $cfg = json_decode((string) file_get_contents($configJsonPath), true);
            if (is_array($cfg)) {
                $projectId = (string) ($cfg['projectId'] ?? $projectId);
                $apiKey    = (string) ($cfg['apiKey'] ?? '');
            }
        }
    }

    try {
        $verifier = new \Staff\FirebaseAuth($projectId, $apiKey);
        $identity = $verifier->verify($idToken);
    } catch (\Staff\FirebaseAuthException $e) {
        json_out(['error' => 'Firebase authentication failed'], 401);
    }

    if (empty($identity['emailVerified'])) {
        json_out(['error' => 'Email must be verified before accessing Admin CRM'], 403);
    }

    $email = strtolower(trim((string) ($identity['email'] ?? '')));
    $uid   = trim((string) ($identity['uid'] ?? ''));

    // Check explicit allowlists first (ADMIN_FIREBASE_EMAILS / ADMIN_FIREBASE_UIDS)
    $allowedEmails = array_filter(array_map('strtolower', array_map('trim', explode(',', ctc_env('ADMIN_FIREBASE_EMAILS', '')))));
    $allowedUids   = array_filter(array_map('trim', explode(',', ctc_env('ADMIN_FIREBASE_UIDS', ''))));

    if (($email !== '' && in_array($email, $allowedEmails, true)) || ($uid !== '' && in_array($uid, $allowedUids, true))) {
        $authenticated = true;
        $authActor = $email !== '' ? $email : $uid;
    }

    // Fallback: match against existing admin_users table by username/email
    if (!$authenticated && $email !== '') {
        $stmt = db()->prepare('SELECT username FROM admin_users WHERE LOWER(username) = ? LIMIT 1');
        if ($stmt) {
            $stmt->bind_param('s', $email);
            if ($stmt->execute() && $stmt->get_result()->fetch_assoc()) {
                $authenticated = true;
                $authActor = $email;
            }
        }
    }

    if (!$authenticated) {
        json_out(['error' => 'This Google/Firebase account is not authorized for Website Admin CRM'], 403);
    }
} else {
    // 2. Legacy username/password login (db.php constants or admin_users table)
    if ($user === '' || $pass === '') {
        json_out(['error' => 'Username and password are required'], 400);
    }

    if (defined('ADMIN_USER') && defined('ADMIN_PASS') && $user === ADMIN_USER && $pass === ADMIN_PASS) {
        $authenticated = true;
    }

    if (!$authenticated) {
        $stmt = db()->prepare('SELECT password_hash FROM admin_users WHERE username = ? LIMIT 1');
        if ($stmt) {
            $stmt->bind_param('s', $user);
            if ($stmt->execute()) {
                $row = $stmt->get_result()->fetch_assoc();
                if ($row && isset($row['password_hash'])) {
                    $hash = (string) $row['password_hash'];
                    if (password_verify($pass, $hash) || hash_equals($hash, $pass)) {
                        $authenticated = true;
                    }
                }
            }
        }
    }

    if (!$authenticated) {
        json_out(['error' => 'Invalid credentials'], 401);
    }
}

session_regenerate_id(true);
$_SESSION['admin'] = true;
$_SESSION['admin_user'] = $authActor;
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
json_out(['success' => true, 'csrf_token' => $_SESSION['csrf_token'], 'email' => $authActor]);
