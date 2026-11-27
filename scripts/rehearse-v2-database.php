<?php
declare(strict_types=1);
// Disposable loopback database only. Never accepts a connection string or database name.
if (PHP_SAPI !== 'cli' || getenv('STAFF_LOCAL_TEST') !== '1') throw new RuntimeException('Local fictional test only.');
$release = realpath($argv[1] ?? '');
$releases = realpath(__DIR__ . '/../releases');
if (!$release || !$releases || !str_starts_with($release, $releases . DIRECTORY_SEPARATOR)) throw new RuntimeException('Prepared local release required.');
$db = new PDO('mysql:host=127.0.0.1;port=3397;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$databases = [];
$results = [];
try {
    foreach (['01-website.sql', '02-internal-crm.sql', '03-submissions.sql'] as $file) {
        $name = 'attaie_release_fixture_' . bin2hex(random_bytes(8));
        if (!preg_match('/^attaie_release_fixture_[a-f0-9]{16}$/D', $name)) throw new RuntimeException('Invalid fixture name.');
        $sql = file_get_contents($release . '/database/fresh/' . $file);
        $statements = preg_replace('#/\*.*?\*/|--[^\r\n]*#s', '', $sql);
        if (preg_match('/(?:^|;)\s*(?:USE\s+|(?:CREATE|DROP)\s+DATABASE\b)/i', $statements)) throw new RuntimeException('Schema must not select or create another database.');
        $db->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4");
        $databases[] = $name;
        $db->exec("USE `$name`");
        if ($db->query('SELECT DATABASE()')->fetchColumn() !== $name) throw new RuntimeException('Wrong database.');
        $db->exec($sql);
        $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
        foreach (['projects', 'project_units', 'properties', 'inv_projects', 'inv_apartments', 'core_users'] as $table) {
            if (in_array($table, $tables, true) && (int)$db->query("SELECT COUNT(*) FROM `$table`")->fetchColumn() !== 0) throw new RuntimeException('Fresh catalog/users must be empty: ' . $table);
        }
        $results[] = ['schema'=>$file, 'tables'=>count($tables), 'emptyCatalogAndAccounts'=>true];
    }
    echo json_encode(['engine'=>$db->query('SELECT VERSION()')->fetchColumn(), 'freshSchemas'=>$results], JSON_PRETTY_PRINT) . "\n";
} finally {
    foreach ($databases as $name) {
        if (!preg_match('/^attaie_release_fixture_[a-f0-9]{16}$/D', $name)) throw new RuntimeException('Refusing cleanup.');
        $db->exec("DROP DATABASE `$name`");
    }
}
