<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$options = getopt('', ['username:', 'password::', 'config::', 'sql']);
$username = strtolower(trim((string) ($options['username'] ?? '')));
if ($username === '') {
    fwrite(STDERR, "Usage: php set-staff-password.php --username <email_or_username> [--password <password>] [--config <path/to/config.php>] [--sql]\n");
    exit(1);
}

$password = $options['password'] ?? null;
if (!is_string($password) || $password === '') {
    fwrite(STDOUT, "Enter new password for {$username}: ");
    $password = rtrim((string) fgets(STDIN), "\r\n");
}
if (strlen($password) < 6 || strlen($password) > 128) {
    fwrite(STDERR, "Password must be between 6 and 128 characters.\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$configFile = $options['config'] ?? null;

if (is_string($configFile) && $configFile !== '' && !isset($options['sql'])) {
    $real = realpath($configFile);
    if (!$real || !is_file($real)) {
        fwrite(STDERR, "Config file not found: {$configFile}\n");
        exit(1);
    }
    $config = require $real;
    $pdo = new PDO(
        $config['dsn'],
        $config['database_user'],
        $config['database_password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    $stmt = $pdo->prepare('UPDATE core_users SET password_hash = ?, auth_version = auth_version + 1 WHERE LOWER(username) = LOWER(?)');
    $stmt->execute([$hash, $username]);
    if ($stmt->rowCount() === 0) {
        fwrite(STDERR, "No user found matching username: {$username}\n");
        exit(1);
    }
    fwrite(STDOUT, "Updated password hash and bumped auth_version for {$username}.\n");
    exit(0);
}

$escapedUser = str_replace("'", "''", $username);
$escapedHash = str_replace("'", "''", $hash);
fwrite(STDOUT, "UPDATE core_users SET password_hash = '{$escapedHash}', auth_version = auth_version + 1 WHERE LOWER(username) = LOWER('{$escapedUser}');\n");
