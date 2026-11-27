USE `attaiepropert_crm`;
-- INTERNAL CRM DATABASE ONLY (Import into attaiepropert_crm in phpMyAdmin)
-- Adds password_hash & photo_url columns to core_users and sets default password = 123456
-- Bcrypt hash for '123456': $2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m

SET NAMES utf8mb4;

-- 1. Add password_hash and photo_url columns if they do not exist yet
ALTER TABLE `core_users`
  ADD COLUMN IF NOT EXISTS `password_hash` varchar(255) DEFAULT NULL AFTER `firebase_uid`,
  ADD COLUMN IF NOT EXISTS `photo_url` MEDIUMTEXT DEFAULT NULL AFTER `branch_id`;

-- 2. Ensure the primary headquarters branch exists
INSERT INTO `core_branches` (`id`, `code`, `name`, `address`, `phone`, `email`, `active`)
VALUES (1, 'KBL-HQ', 'Kabul Main Branch', 'Shahr-e Naw, Kabul, Afghanistan', '+93782222279', 'info@attaieproperties.com', 1)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `active` = 1;

-- 3. Insert or update all 12 users with default password = 123456
INSERT INTO `core_users` (`id`, `firebase_uid`, `password_hash`, `name`, `username`, `role`, `branch_id`, `active`, `auth_version`, `created_at`, `department_code`, `team_leader_id`) VALUES
(1, 'AyAy8pvBKMb7Uqj6NFBE03Opw5W2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Faiz Mohammad Attaie', 'ceo@attaieproperties.com', 'ceo', 1, 1, 1, '2026-11-19 02:34:33', 'management', NULL),
(3, 'NqAYxhprk2XKgQtqgjXLTwvpU5U2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Emal Karimi', 'emalkarimi@attaieproperties.com', 'sales', 1, 1, 1, '2026-11-19 11:54:38', 'sales', NULL),
(4, 'yLz9soswvdQJSD8mJFQ5QCREID13', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Atta Ullah', 'attaullah@attaiepropertie.com', 'callcenter', 1, 1, 1, '2026-11-19 11:54:38', 'callcenter', NULL),
(5, 'TVQGvlQj0fd6N9MXozxSTqhL9Ka2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Basir Wahidi', 'Basirwahidi@attaieproperties.com', 'sales_leader', 1, 1, 1, '2026-11-19 11:54:38', 'sales', NULL),
(6, 'EopYP3KgjgNQlJc5ZfZNxraCLpE2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Sameer Kakar', 'sameerkakar@attaieproperties.com', 'marketing_manager', 1, 1, 1, '2026-11-19 11:54:38', 'production', NULL),
(7, 'ezxgoUltXgcZ0qUcnQSYOqjl24e2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Samim Yousufi', 'samimyousufi@attaieproperties.com', 'editor', 1, 1, 1, '2026-11-19 11:54:38', 'production', NULL),
(8, 'JivvGtQfo7bRFPewBeHlTTy8uMY2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Ekram Malik', 'ekrammalik@attaieproperties.com', 'videographer', 1, 1, 1, '2026-11-19 11:54:38', 'production', NULL),
(9, 'Wuz5TNja9fUVMiOXy9ddC9CQYhI2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Said Azam Sadat', 'azamsadat@attaieproperties.com', 'finance_manager', 1, 1, 1, '2026-11-19 11:54:38', 'finance', NULL),
(10, 'IYIRlNZj7bTMa8hQMCsxdUDIzm42', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Milad', 'Milad@attaieproperties.com', 'architect', 1, 1, 1, '2026-11-19 11:54:38', 'engineering', NULL),
(11, 'IvdT8F8pSCdTQortZFPNOlTrUl72', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Samim', 'samim@attaieproperties.com', 'graphic_designer', 1, 1, 1, '2026-11-19 11:54:38', 'engineering', NULL),
(12, '5ysa1VlfyVTEPbxxam1McWze1Ki2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Shaheer Ahmadi', 'shaheerahmadi@attaieproperties.com', 'visual_designer_3d', 1, 1, 1, '2026-11-19 11:54:38', 'engineering', NULL),
(13, 'VsJtlbWTHiVKsrITieyF1olFQgI2', '$2y$10$isQiW6visdxVj1XzAo4gQ.1A25pFU8w9ceCVKmPfnhyAjgRMc1N7m', 'Erfan Malik', 'erfanmalik@attaieproperties.com', 'manager', 1, 1, 1, '2026-11-19 11:54:38', 'management', NULL)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `name` = VALUES(`name`),
  `username` = VALUES(`username`),
  `role` = VALUES(`role`),
  `branch_id` = VALUES(`branch_id`),
  `active` = VALUES(`active`),
  `department_code` = COALESCE(`core_users`.`department_code`, VALUES(`department_code`));

-- 4. Seed core_branch_managers for branch 1 with manager Erfan Malik (user 13)
INSERT INTO `core_branch_managers` (`branch_id`, `manager_user_id`, `assigned_by`, `assigned_at`)
VALUES (1, 13, 1, '2026-11-19 11:54:38')
ON DUPLICATE KEY UPDATE `manager_user_id` = VALUES(`manager_user_id`), `assigned_by` = VALUES(`assigned_by`), `assigned_at` = VALUES(`assigned_at`);

