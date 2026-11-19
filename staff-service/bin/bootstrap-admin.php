<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options=getopt('', ['out:']);
$directory=$options['out'] ?? '';
if (!$directory || file_exists($directory)) throw new RuntimeException('Use --out NEW_PRIVATE_DIRECTORY. Keep output outside all webroots.');
if (!mkdir($directory,0700,true)) throw new RuntimeException('Cannot create private output.');
$sql=<<<'SQL'
-- V2 ONLY. Import after 001-core.sql and 010-callcenter.sql.
-- Generate a bcrypt hash privately via: php set-staff-password.php --username Ceo@attaieproperties.com --sql
-- Empty values intentionally create NO account. No plaintext password belongs in MySQL.
SET @owner_username = '';
SET @owner_password_hash = '';
SET @owner_name = 'Admin (CEO)';
INSERT INTO core_users(username,password_hash,name,role)
SELECT LOWER(@owner_username),@owner_password_hash,@owner_name,'ceo'
WHERE @owner_username <> '' AND @owner_password_hash <> '';
SQL;
file_put_contents($directory.'/020-owner.template.sql',$sql."\n");
file_put_contents($directory.'/MYSQL-AUTH-SETUP.txt',"Keep outside webroot.\nImport 04-seed-all-staff-users.sql or generate a bcrypt hash with set-staff-password.php and populate 020-owner.template.sql.\nNo plaintext password belongs in SQL or upload files.\nCEO: /ceo/; Manager: /management/; Call Center: /callcenter/.\n");
echo "Owner provisioning template and MySQL auth setup instructions prepared. No plaintext credentials generated.\n";
