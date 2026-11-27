<?php
/**
 * Digital Vault API for Attaie Properties V2
 *
 * Full access digital vault for all authenticated internal users / panels.
 * Supports:
 *  - GET: List folders, folder breadcrumbs, and files (with search & filtering)
 *  - POST (action=create_folder): Create folder
 *  - POST (multipart upload): Upload any file with uploader metadata & mime-type
 *  - DELETE: Delete file or folder
 */

require_once __DIR__ . '/bootstrap.php';
cors();
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Resolve verified staff/admin identity from:
 *  1) Website Admin PHP session ($_SESSION['admin']) + CSRF for mutations
 *  2) Verified Firebase Bearer ID token (Authorization: Bearer <id_token>) matched against core_users / admin_users
 *  3) Verified attaie_staff_session cookie (if STAFF_CONFIG_FILE is configured) + CSRF for mutations
 */
function vault_load_staff_config(): ?array {
    $file = getenv('STAFF_CONFIG_FILE') ?: '';
    $real = $file !== '' ? realpath($file) : false;
    $root = realpath($_SERVER['DOCUMENT_ROOT'] ?? __DIR__);
    if (!$real || !$root) return null;
    if (str_starts_with(str_replace('\\', '/', $real), rtrim(str_replace('\\', '/', $root), '/') . '/')) {
        return null;
    }
    $cfg = @require $real;
    return is_array($cfg) ? $cfg : null;
}

function vault_staff_pdo(?array $cfg): ?PDO {
    if (!$cfg || !str_starts_with((string)($cfg['dsn'] ?? ''), 'mysql:')) return null;
    try {
        return new PDO(
            (string)$cfg['dsn'],
            (string)($cfg['database_user'] ?? ''),
            (string)($cfg['database_password'] ?? ''),
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
        );
    } catch (Throwable $e) {
        return null;
    }
}

function vault_bearer_token(): string {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    if ($authHeader === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            foreach ($headers as $k => $v) {
                if (strtolower((string)$k) === 'authorization') {
                    $authHeader = (string)$v;
                    break;
                }
            }
        }
    }
    if (preg_match('/^\s*Bearer\s+(\S+)\s*$/i', (string)$authHeader, $m)) {
        return trim($m[1]);
    }
    return '';
}

$actorName = '';
$actorUid  = '';
$actorRole = '';
$authenticated = false;
$isMutating = in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'], true);

// 1. Website Admin PHP Session
init_secure_session();
if (!empty($_SESSION['admin'])) {
    if ($isMutating) {
        verify_csrf_token();
    }
    $actorName = (string)($_SESSION['admin_user'] ?? 'Admin');
    $actorUid  = 'admin:' . $actorName;
    $actorRole = 'admin';
    $authenticated = true;
}

// 2. Verified attaie_staff_session cookie (when STAFF_CONFIG_FILE is configured)
if (!$authenticated && !empty($_COOKIE['attaie_staff_session'])) {
    $staffCfg = vault_load_staff_config();
    $sessionsDir = $staffCfg ? realpath((string)($staffCfg['session_directory'] ?? '')) : false;
    $staffPdo = vault_staff_pdo($staffCfg);
    if ($sessionsDir && $staffPdo) {
        session_write_close();
        session_name('attaie_staff_session');
        session_save_path($sessionsDir);
        @session_start();
        if (!empty($_SESSION['user_id'])) {
            $stmt = $staffPdo->prepare('SELECT id, name, role, active, auth_version FROM core_users WHERE id = ? LIMIT 1');
            $stmt->execute([$_SESSION['user_id']]);
            $staffRow = $stmt->fetch();
            if ($staffRow && !empty($staffRow['active']) && $staffRow['role'] !== 'finance_assistant' && ($staffRow['auth_version'] ?? null) === ($_SESSION['auth_version'] ?? null)) {
                if ($isMutating) {
                    $expectedCsrf = (string)($_SESSION['csrf'] ?? '');
                    $providedCsrf = trim((string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? ''));
                    if ($expectedCsrf === '' || $providedCsrf === '' || !hash_equals($expectedCsrf, $providedCsrf)) {
                        json_out(['error' => 'Invalid or missing CSRF token'], 403);
                    }
                }
                $actorName = (string)$staffRow['name'];
                $actorUid  = 'staff:' . (string)$staffRow['id'];
                $actorRole = (string)$staffRow['role'];
                $authenticated = true;
            }
        }
    }
}

if (!$authenticated) {
    json_out(['error' => 'Unauthorized'], 401);
}

// Ensure base upload directory exists
$vaultUploadDir = dirname(__DIR__, 2) . '/public/uploads/vault/';
if (!is_dir($vaultUploadDir)) {
    @mkdir($vaultUploadDir, 0755, true);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET: Fetch Vault contents (folders, files, breadcrumbs, search)
// ─────────────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $folderId = isset($_GET['folder_id']) && $_GET['folder_id'] !== '' && $_GET['folder_id'] !== '0'
        ? (int)$_GET['folder_id']
        : null;
    $q = trim((string)($_GET['q'] ?? ''));

    // Breadcrumbs
    $breadcrumbs = [];
    $curr = $folderId;
    while ($curr !== null && $curr > 0) {
        $stmt = db()->prepare('SELECT id, name, parent_id FROM digital_vault_folders WHERE id = ?');
        if ($stmt) {
            $stmt->bind_param('i', $curr);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                array_unshift($breadcrumbs, [
                    'id' => (int)$row['id'],
                    'name' => (string)$row['name'],
                    'parent_id' => $row['parent_id'] !== null ? (int)$row['parent_id'] : null,
                ]);
                $curr = $row['parent_id'] !== null ? (int)$row['parent_id'] : null;
            } else {
                break;
            }
        } else {
            break;
        }
    }

    // Folders
    $folders = [];
    if ($q !== '') {
        $like = '%' . $q . '%';
        $stmt = db()->prepare('SELECT * FROM digital_vault_folders WHERE name LIKE ? ORDER BY name ASC');
        if ($stmt) {
            $stmt->bind_param('s', $like);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) {
                $folders[] = [
                    'id' => (int)$r['id'],
                    'name' => (string)$r['name'],
                    'parent_id' => $r['parent_id'] !== null ? (int)$r['parent_id'] : null,
                    'created_by_name' => (string)$r['created_by_name'],
                    'created_at' => (string)$r['created_at'],
                ];
            }
        }
    } else {
        if ($folderId === null) {
            $res = db()->query('SELECT * FROM digital_vault_folders WHERE parent_id IS NULL ORDER BY name ASC');
        } else {
            $stmt = db()->prepare('SELECT * FROM digital_vault_folders WHERE parent_id = ? ORDER BY name ASC');
            $stmt->bind_param('i', $folderId);
            $stmt->execute();
            $res = $stmt->get_result();
        }
        if ($res) {
            while ($r = $res->fetch_assoc()) {
                $folders[] = [
                    'id' => (int)$r['id'],
                    'name' => (string)$r['name'],
                    'parent_id' => $r['parent_id'] !== null ? (int)$r['parent_id'] : null,
                    'created_by_name' => (string)$r['created_by_name'],
                    'created_at' => (string)$r['created_at'],
                ];
            }
        }
    }

    // Files
    $files = [];
    if ($q !== '') {
        $like = '%' . $q . '%';
        $stmt = db()->prepare('SELECT * FROM digital_vault_files WHERE original_name LIKE ? OR uploader_name LIKE ? ORDER BY created_at DESC');
        if ($stmt) {
            $stmt->bind_param('ss', $like, $like);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) {
                $files[] = [
                    'id' => (int)$r['id'],
                    'folder_id' => $r['folder_id'] !== null ? (int)$r['folder_id'] : null,
                    'original_name' => (string)$r['original_name'],
                    'file_url' => (string)$r['file_url'],
                    'file_size' => (int)$r['file_size'],
                    'mime_type' => (string)$r['mime_type'],
                    'uploader_name' => (string)$r['uploader_name'],
                    'uploader_role' => (string)($r['uploader_role'] ?? ''),
                    'created_at' => (string)$r['created_at'],
                ];
            }
        }
    } else {
        if ($folderId === null) {
            $res = db()->query('SELECT * FROM digital_vault_files WHERE folder_id IS NULL ORDER BY created_at DESC');
        } else {
            $stmt = db()->prepare('SELECT * FROM digital_vault_files WHERE folder_id = ? ORDER BY created_at DESC');
            $stmt->bind_param('i', $folderId);
            $stmt->execute();
            $res = $stmt->get_result();
        }
        if ($res) {
            while ($r = $res->fetch_assoc()) {
                $files[] = [
                    'id' => (int)$r['id'],
                    'folder_id' => $r['folder_id'] !== null ? (int)$r['folder_id'] : null,
                    'original_name' => (string)$r['original_name'],
                    'file_url' => (string)$r['file_url'],
                    'file_size' => (int)$r['file_size'],
                    'mime_type' => (string)$r['mime_type'],
                    'uploader_name' => (string)$r['uploader_name'],
                    'uploader_role' => (string)($r['uploader_role'] ?? ''),
                    'created_at' => (string)$r['created_at'],
                ];
            }
        }
    }

    json_out([
        'folder_id' => $folderId,
        'breadcrumbs' => $breadcrumbs,
        'folders' => $folders,
        'files' => $files,
        'actor' => [
            'name' => $actorName,
            'role' => $actorRole,
        ],
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. POST: Create Folder OR Upload File
// ─────────────────────────────────────────────────────────────────────────────
if ($method === 'POST') {
    // Check if JSON body (Create Folder or JSON upload)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $b = body();
        $action = trim((string)($b['action'] ?? ''));

        if ($action === 'create_folder') {
            $folderName = trim((string)($b['name'] ?? ''));
            if ($folderName === '') {
                json_out(['error' => 'Folder name is required'], 400);
            }
            $parentId = isset($b['parent_id']) && $b['parent_id'] !== '' && $b['parent_id'] !== 0
                ? (int)$b['parent_id']
                : null;

            $userName = trim((string)($b['uploader_name'] ?? $actorName));
            if ($userName === '') $userName = 'Staff';

            $stmt = db()->prepare('INSERT INTO digital_vault_folders (name, parent_id, created_by_name, created_by_uid) VALUES (?, ?, ?, ?)');
            if (!$stmt) {
                json_out(['error' => 'Database prepare failed: ' . db()->error], 500);
            }
            $stmt->bind_param('siss', $folderName, $parentId, $userName, $actorUid);
            if (!$stmt->execute()) {
                json_out(['error' => 'Failed to create folder: ' . db()->error], 500);
            }

            json_out([
                'success' => true,
                'folder' => [
                    'id' => (int)db()->insert_id,
                    'name' => $folderName,
                    'parent_id' => $parentId,
                    'created_by_name' => $userName,
                    'created_at' => date('Y-m-d H:i:s'),
                ]
            ], 201);
        }

        // Support base64 fallback upload via JSON
        if ($action === 'upload_base64') {
            $originalName = trim((string)($b['original_name'] ?? 'document.bin'));
            $dataBase64   = (string)($b['content_base64'] ?? '');
            $folderId     = isset($b['folder_id']) && $b['folder_id'] !== '' && $b['folder_id'] !== 0 ? (int)$b['folder_id'] : null;
            $userName     = trim((string)($b['uploader_name'] ?? $actorName));
            $userRole     = trim((string)($b['uploader_role'] ?? $actorRole));

            $raw = base64_decode($dataBase64, true);
            if ($raw === false) {
                json_out(['error' => 'Invalid base64 payload'], 400);
            }

            $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            $cleanExt = $ext !== '' ? ('.' . preg_replace('/[^a-z0-9]/', '', $ext)) : '.bin';
            $safeName = 'vault_' . uniqid('', true) . $cleanExt;
            $destPath = $vaultUploadDir . $safeName;

            if (@file_put_contents($destPath, $raw) === false) {
                json_out(['error' => 'Failed to write file to vault storage'], 500);
            }
            @chmod($destPath, 0644);

            $fsize = strlen($raw);
            $mime = 'application/octet-stream';
            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                if ($finfo) {
                    $detected = finfo_file($finfo, $destPath);
                    if ($detected) $mime = $detected;
                    finfo_close($finfo);
                }
            }

            $fileUrl = '/uploads/vault/' . $safeName;
            $stmt = db()->prepare('INSERT INTO digital_vault_files (folder_id, original_name, stored_filename, file_url, file_size, mime_type, uploader_name, uploader_uid, uploader_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            if ($stmt) {
                $stmt->bind_param('isssissss', $folderId, $originalName, $safeName, $fileUrl, $fsize, $mime, $userName, $actorUid, $userRole);
                $stmt->execute();
                $insertId = (int)db()->insert_id;
                json_out([
                    'success' => true,
                    'file' => [
                        'id' => $insertId,
                        'folder_id' => $folderId,
                        'original_name' => $originalName,
                        'file_url' => $fileUrl,
                        'file_size' => $fsize,
                        'mime_type' => $mime,
                        'uploader_name' => $userName,
                        'uploader_role' => $userRole,
                        'created_at' => date('Y-m-d H:i:s'),
                    ]
                ], 201);
            }
            json_out(['error' => 'Failed to save file record'], 500);
        }

        json_out(['error' => 'Invalid action'], 400);
    }

    // Multipart Form Upload
    if (!empty($_FILES['file']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
        $folderId = isset($_POST['folder_id']) && $_POST['folder_id'] !== '' && $_POST['folder_id'] !== '0'
            ? (int)$_POST['folder_id']
            : null;
        $userName = trim((string)($_POST['uploader_name'] ?? $actorName));
        if ($userName === '') $userName = 'Staff';
        $userRole = trim((string)($_POST['uploader_role'] ?? $actorRole));

        $orig = $_FILES['file']['name'];
        $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
        $cleanExt = $ext !== '' ? ('.' . preg_replace('/[^a-z0-9]/', '', $ext)) : '.bin';
        $safeName = 'vault_' . uniqid('', true) . $cleanExt;
        $destPath = $vaultUploadDir . $safeName;

        if (!@move_uploaded_file($_FILES['file']['tmp_name'], $destPath)) {
            json_out(['error' => 'Failed to save uploaded file'], 500);
        }
        @chmod($destPath, 0644);

        $fsize = filesize($destPath);
        $mime = $_FILES['file']['type'] ?? 'application/octet-stream';
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $detected = finfo_file($finfo, $destPath);
                if ($detected) $mime = $detected;
                finfo_close($finfo);
            }
        }

        $fileUrl = '/uploads/vault/' . $safeName;
        $stmt = db()->prepare('INSERT INTO digital_vault_files (folder_id, original_name, stored_filename, file_url, file_size, mime_type, uploader_name, uploader_uid, uploader_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        if ($stmt) {
            $stmt->bind_param('isssissss', $folderId, $orig, $safeName, $fileUrl, $fsize, $mime, $userName, $actorUid, $userRole);
            $stmt->execute();
            $insertId = (int)db()->insert_id;
            json_out([
                'success' => true,
                'file' => [
                    'id' => $insertId,
                    'folder_id' => $folderId,
                    'original_name' => $orig,
                    'file_url' => $fileUrl,
                    'file_size' => $fsize,
                    'mime_type' => $mime,
                    'uploader_name' => $userName,
                    'uploader_role' => $userRole,
                    'created_at' => date('Y-m-d H:i:s'),
                ]
            ], 201);
        }
        json_out(['error' => 'Database record failed'], 500);
    }

    json_out(['error' => 'No file received'], 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DELETE: Delete File or Folder
// ─────────────────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $b = body();
    $type = trim((string)($b['type'] ?? 'file'));
    $id = (int)($b['id'] ?? 0);

    if (!$id) {
        json_out(['error' => 'Valid id is required'], 400);
    }

    if ($type === 'folder') {
        // Delete folder & any files inside it
        $stmt = db()->prepare('SELECT stored_filename FROM digital_vault_files WHERE folder_id = ?');
        if ($stmt) {
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) {
                @unlink($vaultUploadDir . $r['stored_filename']);
            }
        }
        $delFiles = db()->prepare('DELETE FROM digital_vault_files WHERE folder_id = ?');
        if ($delFiles) {
            $delFiles->bind_param('i', $id);
            $delFiles->execute();
        }

        $delFolder = db()->prepare('DELETE FROM digital_vault_folders WHERE id = ?');
        if ($delFolder) {
            $delFolder->bind_param('i', $id);
            $delFolder->execute();
        }

        json_out(['success' => true, 'deleted_folder_id' => $id]);
    } else {
        // Delete single file
        $stmt = db()->prepare('SELECT stored_filename FROM digital_vault_files WHERE id = ?');
        if ($stmt) {
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if ($row) {
                @unlink($vaultUploadDir . $row['stored_filename']);
            }
        }
        $del = db()->prepare('DELETE FROM digital_vault_files WHERE id = ?');
        if ($del) {
            $del->bind_param('i', $id);
            $del->execute();
        }
        json_out(['success' => true, 'deleted_file_id' => $id]);
    }
}

json_out(['error' => 'Method not allowed'], 405);
