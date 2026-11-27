-- Digital Vault Schema: Folders and Files for Attaie Properties V2

CREATE TABLE IF NOT EXISTS digital_vault_folders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INT UNSIGNED DEFAULT NULL,
  created_by_name VARCHAR(150) NOT NULL DEFAULT 'System',
  created_by_uid VARCHAR(128) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vault_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS digital_vault_files (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folder_id INT UNSIGNED DEFAULT NULL,
  original_name VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
  mime_type VARCHAR(120) NOT NULL DEFAULT 'application/octet-stream',
  uploader_name VARCHAR(150) NOT NULL DEFAULT 'Anonymous',
  uploader_uid VARCHAR(128) DEFAULT NULL,
  uploader_role VARCHAR(60) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vault_folder (folder_id),
  INDEX idx_vault_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
