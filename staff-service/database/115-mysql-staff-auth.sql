-- V2 INTERNAL CRM UPGRADE: Migrate core_users from Firebase Auth to MySQL password_hash.
-- Select the Internal CRM database in phpMyAdmin before import.
SET NAMES utf8mb4;

ALTER TABLE core_users
  MODIFY COLUMN firebase_uid VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NULL,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER username;
