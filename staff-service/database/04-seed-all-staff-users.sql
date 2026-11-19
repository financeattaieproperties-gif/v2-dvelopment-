-- INTERNAL CRM DATABASE ONLY (Select your Internal CRM database in phpMyAdmin before import)
-- Seeds or updates all 12 staff accounts with bcrypt password hashes for initial password `123456`.
-- Never stores plaintext passwords. Existing non-empty password_hash values are preserved.

SET NAMES utf8mb4;

-- 1. Ensure the primary headquarters branch exists
INSERT INTO core_branches (id, code, name, address, phone, email, active)
VALUES (1, 'KBL-HQ', 'Kabul Main Branch', 'Shahr-e Naw, Kabul, Afghanistan', '+93782222279', 'info@attaieproperties.com', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name), active = 1;

-- 2. Insert or update all 12 staff accounts
-- 1. CEO
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('Ceo@attaieproperties.com', 'Faiz Mohammad Attaie', 'ceo', 1, 1, '$2y$10$M.Z6M/5.psc2dIvNSzI2ZeDBvjHFDkKnczPQNiHdlc7sqBC8v/ZBS')
ON DUPLICATE KEY UPDATE name=VALUES(name), role='ceo', branch_id=1, active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 2. Sales Agent
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('emalkarimi@attaieproperties.com', 'Emal Karimi', 'sales', 1, 1, '$2y$10$ilk/gaHUSsGquF5QSg2h1OyA6ZVfyJqAUkttMYHTegH/m2J5VHpLq')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 3. Call Center Agent
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('attaullah@attaieproperties.com', 'Atta Ullah', 'callcenter', 1, 1, '$2y$10$DmFk17UbGMQUO3lN2wStIepaXF3TTjJrYtGe/906.35CttemRMlu2')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 4. Sales Team Leader
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('Basirwahidi@attaieproperties.com', 'Basir Wahidi', 'sales_leader', 1, 1, '$2y$10$fpoQjIC3WHG2iFnny7xepOS/7xR9UwW1Il.HloxVknChGg2hYYz9G')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 5. Marketing Manager
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('sameerkakar@attaieproperties.com', 'Sameer Kakar', 'marketing_manager', 1, 1, '$2y$10$WGPV27cycsyVsMDPIBcLXOWS66IDMzxcDffyOekLJxRLdGd9fltmC')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 6. Editor
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('samimyousufi@attaieproperties.com', 'Samim Yousufi', 'editor', 1, 1, '$2y$10$PjH1nlU3pLhIYsIpskXp1u.8EW5y4XzKZIo5pD.FmNg3kP5RCLDdC')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 7. Videographer
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('ekrammalik@attaieproperties.com', 'Ekram Malik', 'videographer', 1, 1, '$2y$10$JWsEFk9JS1IU7lb9eTycMOHxovOOzPh3JTpoh9TSHghOxxI0EtGiO')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 8. Finance Manager
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('azamsadat@attaieproperties.com', 'Said Azam Sadat', 'finance_manager', 1, 1, '$2y$10$NSPKGOKou1YWAz1imYiJ3ullMNEratpkuyoF8/ZuH.FiXkMENq4pe')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 9. Architect
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('Milad@attaieproperties.com', 'Milad', 'architect', 1, 1, '$2y$10$kIfKZLI3jHk5HdS/FneLTuO0OPPBStWqPgPnK8L0gx0s1aaY94m8m')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 10. Graphic Designer
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('samim@attaieproperties.com', 'Samim', 'graphic_designer', 1, 1, '$2y$10$aB2MGSdOjh1lLnoUS8WjpupUMoCMvoYG6XEsxvAW5OQ9erGSwZMCq')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 11. 3D Visual Designer
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('shaheerahmadi@attaieproperties.com', 'Shaheer Ahmadi', 'visual_designer_3d', 1, 1, '$2y$10$GSHy7gPiQpsWa39UXYT1X.EyHqZR3FpZcqBk3UCPoAhFadXErl2U6')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));

-- 12. Manager
INSERT INTO core_users (username, name, role, branch_id, active, password_hash)
VALUES ('erfanmalik@attaieproperties.com', 'Erfan Malik', 'manager', 1, 1, '$2y$10$EXt/35x3FLccn7VYanmLJOVcAiWYmWgd3s/5n.QLVbGnDIr3Z3BkG')
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), branch_id=VALUES(branch_id), active=1, password_hash=COALESCE(NULLIF(password_hash, ''), VALUES(password_hash));
