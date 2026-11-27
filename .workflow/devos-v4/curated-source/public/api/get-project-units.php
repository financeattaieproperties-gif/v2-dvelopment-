<?php
require_once __DIR__ . '/bootstrap.php';
cors();

function decode_gallery(?string $raw): array {
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? array_values(array_filter($decoded)) : [];
}

function normalize_public_unit_row(array $row): array {
    $row['id']         = (int) $row['id'];
    $row['project_id'] = (int) $row['project_id'];
    $row['beds']       = $row['beds']  !== null ? (int) $row['beds']   : null;
    $row['baths']      = $row['baths'] !== null ? (int) $row['baths']  : null;
    $row['area']       = $row['area']  !== null ? (float) $row['area'] : null;
    $row['floor']      = $row['floor'] !== null ? (int) $row['floor']  : null;
    $row['price']      = $row['price'] !== null ? (float) $row['price']: null;

    $gallery = decode_gallery($row['gallery_images'] ?? null);
    $video = !empty($row['video_url']) ? (string) $row['video_url'] : null;
    $techPlan = !empty($row['technical_plan_url']) ? (string) $row['technical_plan_url'] : null;
    $desc = (string) ($row['description'] ?? '');

    if (strpos($desc, '[TECHNICAL_PLAN:') !== false) {
        if (preg_match('/\[TECHNICAL_PLAN:\s*([^\]]+)\]/', $desc, $m)) {
            if (!$techPlan) $techPlan = trim($m[1]);
            $desc = trim(preg_replace('/\[TECHNICAL_PLAN:\s*[^\]]+\]/', '', $desc));
        }
    }
    if (strpos($desc, '[GALLERY:') !== false) {
        if (preg_match('/\[GALLERY:\s*(\[[^\]]*\])\]/', $desc, $m)) {
            $parsed = json_decode($m[1], true);
            if (is_array($parsed) && empty($gallery)) $gallery = array_values(array_filter($parsed));
            $desc = trim(preg_replace('/\[GALLERY:\s*\[[^\]]*\]\]/', '', $desc));
        }
    }
    if (strpos($desc, '[VIDEO:') !== false) {
        if (preg_match('/\[VIDEO:\s*([^\]]+)\]/', $desc, $m)) {
            if (!$video) $video = trim($m[1]);
            $desc = trim(preg_replace('/\[VIDEO:\s*[^\]]+\]/', '', $desc));
        }
    }

    $row['description']        = $desc !== '' ? $desc : null;
    $row['gallery_images']     = $gallery;
    $row['video_url']          = $video;
    $row['technical_plan_url'] = $techPlan;
    return $row;
}

$projectId = intval($_GET['project_id'] ?? 0);
$allUnits  = !empty($_GET['all']);
if (!$projectId && !$allUnits) {
    json_out(['error' => 'project_id or all=1 required'], 400);
}

$status = trim($_GET['status'] ?? '');
$allowed = ['available', 'reserved', 'sold', 'rented'];
if ($status !== '' && !in_array($status, $allowed, true)) {
    json_out(['error' => 'Invalid status'], 400);
}

$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
$offset = ($page - 1) * $limit;

$whereSql = ' WHERE 1=1';
$types = '';
$params = [];

if ($projectId > 0) {
    $whereSql .= ' AND u.project_id = ?';
    $types .= 'i';
    $params[] = $projectId;
}
if ($status !== '') {
    $whereSql .= ' AND u.status = ?';
    $types .= 's';
    $params[] = $status;
}

$countSql = 'SELECT COUNT(*) AS total FROM project_units u INNER JOIN projects p ON p.id = u.project_id' . $whereSql;
$countStmt = db()->prepare($countSql);
if (!$countStmt) {
    json_out(['items' => [], 'page' => $page, 'limit' => $limit, 'total' => 0, 'has_more' => false]);
}
if ($types !== '') {
    $countStmt->bind_param($types, ...$params);
}
$countStmt->execute();
$totalRow = $countStmt->get_result()->fetch_assoc();
$total = (int) ($totalRow['total'] ?? 0);

// Check if columns exist
$hasGalleryCol = false;
$hasVideoCol = false;
$hasTechPlanCol = false;
$checkCols = db()->query("SHOW COLUMNS FROM project_units LIKE 'gallery_images'");
if ($checkCols && $checkCols->num_rows > 0) $hasGalleryCol = true;
$checkCols2 = db()->query("SHOW COLUMNS FROM project_units LIKE 'video_url'");
if ($checkCols2 && $checkCols2->num_rows > 0) $hasVideoCol = true;
$checkCols3 = db()->query("SHOW COLUMNS FROM project_units LIKE 'technical_plan_url'");
if ($checkCols3 && $checkCols3->num_rows > 0) $hasTechPlanCol = true;

$extraCols = '';
if ($hasGalleryCol)  $extraCols .= ', u.gallery_images';
if ($hasVideoCol)    $extraCols .= ', u.video_url';
if ($hasTechPlanCol) $extraCols .= ', u.technical_plan_url';

$sql = 'SELECT u.id, u.project_id, p.name AS project_name, p.location AS project_location,
               u.unit_number, u.title, u.beds, u.baths, u.area, u.floor, u.price,
               u.currency, u.status, u.image_url, u.description' . $extraCols . '
        FROM project_units u
        INNER JOIN projects p ON p.id = u.project_id'
        . $whereSql
        . ' ORDER BY u.project_id ASC, u.floor ASC, u.unit_number ASC LIMIT ? OFFSET ?';

$pageTypes = $types . 'ii';
$pageParams = [...$params, $limit, $offset];

$stmt = db()->prepare($sql);
if (!$stmt) {
    json_out(['items' => [], 'page' => $page, 'limit' => $limit, 'total' => 0, 'has_more' => false]);
}
$stmt->bind_param($pageTypes, ...$pageParams);
$stmt->execute();
$result = $stmt->get_result();
$rows = [];
while ($row = $result->fetch_assoc()) {
    $rows[] = normalize_public_unit_row($row);
}
$hasMore = ($offset + count($rows)) < $total;
json_out([
    'items'    => $rows,
    'page'     => $page,
    'limit'    => $limit,
    'total'    => $total,
    'has_more' => $hasMore,
]);
