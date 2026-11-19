<?php
// Keep real config outside ALL document roots. Use a NEW staff database only.
return [
    'dsn' => 'mysql:host=localhost;dbname=NEW_STAFF_DATABASE;charset=utf8mb4',
    'database_user' => 'NEW_STAFF_RUNTIME_USER',
    'database_password' => '',
    'origin' => 'https://attaieproperties.com',
    'allowed_origins' => ['https://www.attaieproperties.com'],
    'session_directory' => '/home/CPANEL_USER/private-staff/sessions',
    'allow_local_http' => false,
    // Third database: no CRM or website runtime credentials. Leave blank to keep outbox pending.
    'submission_dsn' => 'mysql:host=localhost;dbname=NEW_SUBMISSION_DATABASE;charset=utf8mb4',
    'submission_user' => 'NEW_SUBMISSION_RUNTIME_USER',
    'submission_password' => '',
];
