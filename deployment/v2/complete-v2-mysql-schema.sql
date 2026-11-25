-- ==============================================================================
-- Attaie Properties V2 — Complete Consolidated MySQL Schema (Website + Staff CRM + Submissions)
-- ==============================================================================
-- Includes:
--   • Part A: Public Website, Catalog Admin (/admin), Careers, Visits, CTC, SEO, AI Chat, Publication Map (20 tables)
--   • Part B: Shared Staff Core Identity, RBAC, Branches, Files, Tasks, Audit & Idempotency (15 tables)
--   • Part C: Call Center & Sales CRM Module (/callcenter & /management) (8 tables)
--   • Part D: Pre-Sale Inventory, Sales CRM Claims, HR Contracts, Finance & Engineering (15 tables)
--   • Part E: Isolated Submission Bridge (4 tables)
--
-- Instructions:
--   1. Open cPanel > phpMyAdmin, select your V2 database, and click the "SQL" tab.
--   2. Paste and execute this entire script.
--   3. Every statement uses CREATE TABLE IF NOT EXISTS and INSERT IGNORE so it is
--      100% idempotent and safe to run on a fresh or existing V2 database.
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- PART A: PUBLIC WEBSITE & CATALOG ADMIN TABLES (19 TABLES)
-- ==============================================================================

-- 1. Admin Users (for /admin website catalog login)
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Properties
CREATE TABLE IF NOT EXISTS properties (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  serial_number    VARCHAR(50)    NOT NULL,
  title            VARCHAR(255)   NOT NULL,
  price            DECIMAL(12,2)  NOT NULL,
  location         VARCHAR(255)   NOT NULL,
  beds             TINYINT        DEFAULT NULL,
  baths            TINYINT        DEFAULT NULL,
  area             DECIMAL(8,2)   DEFAULT NULL,
  floor            TINYINT        DEFAULT NULL,
  status           ENUM('available','pending','sold','rented') NOT NULL DEFAULT 'available',
  type             ENUM('Villa','Apartment','House','Commercial','Land') NOT NULL,
  listing_type     ENUM('sale','rent') NOT NULL,
  image_url        VARCHAR(500)   DEFAULT NULL,
  description      TEXT           DEFAULT NULL,
  gallery_images   TEXT           DEFAULT NULL,
  video_url        VARCHAR(1000)  DEFAULT NULL,
  floor_plan_url   VARCHAR(500)   DEFAULT NULL,
  three_d_plan_url VARCHAR(500)   DEFAULT NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_properties_serial (serial_number),
  INDEX idx_properties_status_type (status, type),
  INDEX idx_properties_listing_type (listing_type),
  INDEX idx_properties_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Projects (Multi-Unit Developments)
CREATE TABLE IF NOT EXISTS projects (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255)  NOT NULL,
  location         VARCHAR(255)  NOT NULL,
  delivery_date    VARCHAR(50)   DEFAULT NULL,
  status           ENUM('Coming Soon','In Progress','Sold Out','Under Construction','Ready') NOT NULL DEFAULT 'Coming Soon',
  available_units  INT           DEFAULT 0,
  total_units      INT           DEFAULT 0,
  image_url        VARCHAR(500)  DEFAULT NULL,
  gallery_images   TEXT          DEFAULT NULL,
  video_url        VARCHAR(1000) DEFAULT NULL,
  masterplan_image VARCHAR(500)  DEFAULT NULL,
  description      TEXT          DEFAULT NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_projects_status (status),
  INDEX idx_projects_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Project Units (Apartments / Commercial Units within a Project)
CREATE TABLE IF NOT EXISTS project_units (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  project_id   INT           NOT NULL,
  unit_number  VARCHAR(80)   NOT NULL,
  title        VARCHAR(255)  DEFAULT NULL,
  beds         TINYINT       DEFAULT NULL,
  baths        TINYINT       DEFAULT NULL,
  area         DECIMAL(8,2)  DEFAULT NULL,
  floor        TINYINT       DEFAULT NULL,
  price        DECIMAL(12,2) DEFAULT NULL,
  currency     CHAR(3)       NOT NULL DEFAULT 'USD',
  status       ENUM('available','reserved','sold','rented') NOT NULL DEFAULT 'available',
  image_url    VARCHAR(500)  DEFAULT NULL,
  gallery_images JSON          DEFAULT NULL,
  video_url    VARCHAR(500)  DEFAULT NULL,
  technical_plan_url VARCHAR(512) DEFAULT NULL,
  description  TEXT          DEFAULT NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_project_units_project_unit (project_id, unit_number),
  INDEX idx_project_units_status (status),
  CONSTRAINT fk_project_units_project
    FOREIGN KEY (project_id) REFERENCES projects(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Agents (Real Estate Advisors & Specialists)
CREATE TABLE IF NOT EXISTS agents (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  role         VARCHAR(160) NOT NULL,
  background   TEXT         NOT NULL,
  portrait_url VARCHAR(500) NOT NULL,
  phone        VARCHAR(50)  NOT NULL,
  email        VARCHAR(255) NOT NULL,
  whatsapp     VARCHAR(50)  DEFAULT NULL,
  published    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_agents_published_name (published, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Branches (Office Locations)
CREATE TABLE IF NOT EXISTS branches (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  address    VARCHAR(500) NOT NULL,
  phone      VARCHAR(50)  DEFAULT NULL,
  email      VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_branches_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Website Leads & Property Inquiries
CREATE TABLE IF NOT EXISTS leads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  phone         VARCHAR(50)  NOT NULL,
  message       TEXT         DEFAULT NULL,
  property_id   VARCHAR(50)  DEFAULT NULL,
  property_name VARCHAR(255) DEFAULT NULL,
  stage         VARCHAR(50)  DEFAULT 'New',
  source        VARCHAR(50)  DEFAULT 'Website',
  status        VARCHAR(50)  DEFAULT 'Pending',
  client_request_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  payload_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  receipt_reference VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  receipt_submitted_at DATETIME DEFAULT NULL,
  followup_status ENUM('new','in_progress','resolved') NOT NULL DEFAULT 'new',
  followup_notes TEXT DEFAULT NULL,
  followup_at DATETIME DEFAULT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_inquiry_request (client_request_id),
  UNIQUE KEY uq_inquiry_receipt (receipt_reference),
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_leads_status_stage (status, stage),
  INDEX idx_leads_property_id (property_id),
  INDEX idx_leads_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7b. Website Inquiry Follow-up Events
CREATE TABLE IF NOT EXISTS website_inquiry_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id INT NOT NULL,
  actor VARCHAR(100) NOT NULL,
  previous_status VARCHAR(30) NOT NULL,
  next_status VARCHAR(30) NOT NULL,
  notes TEXT DEFAULT NULL,
  followup_at DATETIME DEFAULT NULL,
  version INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_inquiry_event (inquiry_id, id),
  CONSTRAINT fk_inquiry_event FOREIGN KEY (inquiry_id) REFERENCES leads(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7c. Site-Wide SEO Keywords Toggle Catalog
CREATE TABLE IF NOT EXISTS seo_keywords (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  keyword    VARCHAR(180) NOT NULL,
  enabled    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seo_keyword (keyword),
  INDEX idx_seo_keywords_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Visit Requests & Viewing Appointments
CREATE TABLE IF NOT EXISTS visit_requests (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  phone            VARCHAR(20)  NOT NULL,
  ip_address       VARCHAR(45)  DEFAULT NULL,
  property_id      INT          DEFAULT NULL,
  project_id       INT          DEFAULT NULL,
  project_unit_id  INT          DEFAULT NULL,
  listing_name     VARCHAR(255) NOT NULL,
  requested_at     DATETIME     NOT NULL,
  status           ENUM('pending','confirmed','declined','completed','cancelled') NOT NULL DEFAULT 'pending',
  staff_note       TEXT         DEFAULT NULL,
  source           VARCHAR(50)  NOT NULL DEFAULT 'Website',
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_visit_requests_requested_at (requested_at),
  INDEX idx_visit_requests_status (status),
  INDEX idx_visit_requests_property (property_id),
  INDEX idx_visit_requests_project (project_id),
  INDEX idx_visit_requests_unit (project_unit_id),
  INDEX idx_visit_requests_ip_time (ip_address, created_at),
  INDEX idx_visit_requests_phone_time (phone, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Visit Request Audit Events
CREATE TABLE IF NOT EXISTS visit_request_events (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  visit_request_id INT          NOT NULL,
  previous_status  VARCHAR(30)  DEFAULT NULL,
  next_status      VARCHAR(30)  NOT NULL,
  actor            VARCHAR(100) NOT NULL DEFAULT 'system',
  note             TEXT         DEFAULT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_events_request_id (visit_request_id),
  CONSTRAINT fk_visit_events_request
    FOREIGN KEY (visit_request_id) REFERENCES visit_requests(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Visit Rate Limit Log
CREATE TABLE IF NOT EXISTS visit_rate_limit_log (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  phone_hash CHAR(64)    NOT NULL,
  outcome    ENUM('allowed','blocked_ip','blocked_phone') NOT NULL,
  created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_rl_ip_time (ip_address, created_at),
  INDEX idx_visit_rl_phone_time (phone_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Etisalat CPaaS Click-to-Call Token Cache
CREATE TABLE IF NOT EXISTS ctc_auth_cache (
  id         TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  id_token   TEXT     NOT NULL,
  expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Etisalat CPaaS Public Call Log
CREATE TABLE IF NOT EXISTS ctc_public_call_log (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_number     VARCHAR(20)  NOT NULL,
  ip_address          VARCHAR(45)  NOT NULL,
  reference_id        INT UNSIGNED NOT NULL,
  etisalat_request_id VARCHAR(50)  DEFAULT NULL,
  status              ENUM('initiated','failed','blocked') DEFAULT 'initiated',
  response_payload    TEXT         DEFAULT NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ctc_ip_time (ip_address, created_at),
  INDEX idx_ctc_number_time (customer_number, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Persistent Site-Wide SEO Settings
CREATE TABLE IF NOT EXISTS seo_settings (
  id                  TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
  site_name           VARCHAR(120)  NOT NULL DEFAULT 'Attaie Properties',
  default_title       VARCHAR(255)  NOT NULL DEFAULT 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
  title_template      VARCHAR(160)  NOT NULL DEFAULT '%s | Attaie Properties',
  template            VARCHAR(160)  NOT NULL DEFAULT '%s | Attaie Properties',
  default_description TEXT          NOT NULL,
  description         TEXT          DEFAULT NULL,
  keywords            TEXT          DEFAULT NULL,
  og_image            VARCHAR(500)  DEFAULT '/logo.png',
  twitter_image       VARCHAR(500)  DEFAULT NULL,
  twitter_card        ENUM('summary_large_image','summary') NOT NULL DEFAULT 'summary_large_image',
  twitter_site        VARCHAR(100)  DEFAULT '@AttaieProps',
  canonical_base_url  VARCHAR(255)  DEFAULT 'https://attaieproperties.com',
  robots_index        TINYINT(1)    NOT NULL DEFAULT 1,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seo_settings_site_name (site_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO seo_settings (
  id, site_name, default_title, title_template, template,
  default_description, description, keywords, og_image,
  twitter_image, twitter_card, twitter_site, canonical_base_url, robots_index
) VALUES (
  1,
  'Attaie Properties',
  'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
  '%s | Attaie Properties',
  '%s | Attaie Properties',
  'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
  'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
  'Attaie Properties, Kabul real estate, properties for sale in Kabul, properties for rent in Kabul, luxury villas Kabul, apartments in Kabul, Afghanistan property agency',
  '/logo.png',
  NULL,
  'summary_large_image',
  '@AttaieProps',
  'https://attaieproperties.com',
  1
);

-- 14. Career Job Postings
CREATE TABLE IF NOT EXISTS career_jobs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  location        VARCHAR(255) NOT NULL DEFAULT 'Kabul, Afghanistan',
  employment_type VARCHAR(100) NOT NULL DEFAULT 'Full-Time',
  description     TEXT         NOT NULL,
  qualifications  TEXT         NOT NULL,
  deadline_at     DATETIME     NOT NULL,
  status          ENUM('draft','published','closed') NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_career_jobs_status_deadline (status, deadline_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Career Job Applications
CREATE TABLE IF NOT EXISTS career_applications (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  job_id              INT          NOT NULL,
  name                VARCHAR(255) NOT NULL,
  father_name         VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(50)  NOT NULL,
  address             VARCHAR(500) NOT NULL,
  photo_path          VARCHAR(500) NOT NULL,
  photo_original_name VARCHAR(255) NOT NULL,
  photo_mime_type     VARCHAR(100) NOT NULL,
  photo_size          INT UNSIGNED NOT NULL,
  cv_path             VARCHAR(500) NOT NULL,
  cv_original_name    VARCHAR(255) NOT NULL,
  cv_mime_type        VARCHAR(100) NOT NULL,
  cv_size             INT UNSIGNED NOT NULL,
  ip_address          VARCHAR(45)  DEFAULT NULL,
  created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_career_apps_job_created (job_id, created_at),
  INDEX idx_career_apps_ip_created (ip_address, created_at),
  CONSTRAINT fk_career_apps_job
    FOREIGN KEY (job_id) REFERENCES career_jobs(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. AI Chat Conversations
CREATE TABLE IF NOT EXISTS ai_chat_conversations (
  id               VARCHAR(64)  NOT NULL PRIMARY KEY,
  owner_token_hash CHAR(64)     NOT NULL,
  provider         VARCHAR(32)  NOT NULL DEFAULT 'gemini',
  model            VARCHAR(80)  NOT NULL DEFAULT 'gemini-2.5-flash',
  language         VARCHAR(10)  NOT NULL DEFAULT 'fa',
  last_property_id INT          DEFAULT NULL,
  page_context     VARCHAR(255) DEFAULT NULL,
  handoff_status   ENUM('none','delivered_to_crm','stored_pending_setup') NOT NULL DEFAULT 'none',
  lead_submitted   TINYINT(1)   NOT NULL DEFAULT 0,
  lead_hash        CHAR(64)     DEFAULT NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ai_conv_owner (owner_token_hash),
  INDEX idx_ai_conv_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. AI Chat Messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id              VARCHAR(64)  NOT NULL PRIMARY KEY,
  conversation_id VARCHAR(64)  NOT NULL,
  sender          ENUM('customer','assistant','system') NOT NULL,
  message_text    TEXT         NOT NULL,
  verified_cards  JSON         DEFAULT NULL,
  provider        VARCHAR(32)  DEFAULT NULL,
  model           VARCHAR(80)  DEFAULT NULL,
  suggest_handoff TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_msg_conv_created (conversation_id, created_at),
  CONSTRAINT fk_ai_msg_conversation
    FOREIGN KEY (conversation_id) REFERENCES ai_chat_conversations(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. AI Chat Handoffs
CREATE TABLE IF NOT EXISTS ai_chat_handoffs (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id VARCHAR(64)  NOT NULL,
  customer_name   VARCHAR(120) NOT NULL,
  customer_phone  VARCHAR(30)  NOT NULL,
  customer_email  VARCHAR(255) DEFAULT NULL,
  customer_notes  TEXT         DEFAULT NULL,
  consent_given   TINYINT(1)   NOT NULL DEFAULT 1,
  lead_hash       CHAR(64)     NOT NULL,
  delivery_status ENUM('delivered_to_crm','stored_pending_setup') NOT NULL DEFAULT 'delivered_to_crm',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ai_handoff_hash (lead_hash),
  INDEX idx_ai_handoff_conv (conversation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. AI Chat Rate Limits
CREATE TABLE IF NOT EXISTS ai_chat_rate_limits (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bucket     VARCHAR(40)  NOT NULL,
  ip_hash    CHAR(64)     NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_rl_bucket_ip_time (bucket, ip_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19b. Website Submission Publications Retry Ledger
CREATE TABLE IF NOT EXISTS website_submission_publications (
  submission_id INT UNSIGNED PRIMARY KEY,
  property_id   INT NOT NULL UNIQUE,
  published_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_website_sub_pub_prop FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ==============================================================================
-- PART B: STAFF CORE IDENTITY, RBAC & MANAGEMENT TASKS (12 TABLES)
-- ==============================================================================

-- 20. Core Modules
CREATE TABLE IF NOT EXISTS core_modules (
  code VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  installed_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. Core Module Versions
CREATE TABLE IF NOT EXISTS core_module_versions (
  module_code VARCHAR(60) NOT NULL,
  version INT UNSIGNED NOT NULL,
  applied_at DATETIME NOT NULL,
  PRIMARY KEY (module_code, version),
  FOREIGN KEY (module_code) REFERENCES core_modules(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. Core Departments
CREATE TABLE IF NOT EXISTS core_departments (
  code VARCHAR(60) PRIMARY KEY,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. Core Roles
CREATE TABLE IF NOT EXISTS core_roles (
  code VARCHAR(60) PRIMARY KEY,
  department_code VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  FOREIGN KEY (department_code) REFERENCES core_departments(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. Core Permissions
CREATE TABLE IF NOT EXISTS core_permissions (
  code VARCHAR(100) PRIMARY KEY,
  module_code VARCHAR(60) NOT NULL,
  description VARCHAR(255) NOT NULL,
  FOREIGN KEY (module_code) REFERENCES core_modules(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 25. Core Role Permissions
CREATE TABLE IF NOT EXISTS core_role_permissions (
  role_code VARCHAR(60) NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  PRIMARY KEY (role_code, permission_code),
  FOREIGN KEY (role_code) REFERENCES core_roles(code),
  FOREIGN KEY (permission_code) REFERENCES core_permissions(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 26. Core Branches
CREATE TABLE IF NOT EXISTS core_branches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL DEFAULT '',
  active TINYINT NOT NULL DEFAULT 1,
  version INT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 27. Core Users (Firebase-mapped staff accounts; no passwords stored here)
CREATE TABLE IF NOT EXISTS core_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(254) NOT NULL UNIQUE,
  role VARCHAR(60) NOT NULL,
  department_code VARCHAR(60) NULL,
  team_leader_id INT UNSIGNED NULL,
  branch_id INT UNSIGNED NULL,
  photo_url VARCHAR(500) NULL,
  active TINYINT NOT NULL DEFAULT 1,
  auth_version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role) REFERENCES core_roles(code),
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  INDEX idx_core_users_role_active (role, active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO core_branches (id, code, name, active)
VALUES (1, 'HQ', 'Main Branch (Kabul)', 1);

-- 28. Canonical Branch Manager Assignment
CREATE TABLE IF NOT EXISTS core_branch_managers (
  branch_id INT UNSIGNED PRIMARY KEY,
  manager_user_id INT UNSIGNED NOT NULL UNIQUE,
  assigned_by INT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  FOREIGN KEY (manager_user_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. Core Login Limits
CREATE TABLE IF NOT EXISTS core_login_limits (
  bucket CHAR(64) PRIMARY KEY,
  attempts INT NOT NULL,
  window_start DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. Core Management Tasks
CREATE TABLE IF NOT EXISTS core_management_tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id INT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  instructions TEXT NOT NULL,
  priority ENUM('low','normal','high','urgent') NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  assigned_by INT UNSIGNED NOT NULL,
  deadline_at DATETIME NOT NULL,
  status ENUM('todo','in_progress','completed','cancelled') NOT NULL DEFAULT 'todo',
  completed_at DATETIME NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by) REFERENCES core_users(id),
  INDEX idx_core_tasks_branch_status (branch_id, status, deadline_at, id),
  INDEX idx_core_tasks_assignee_status (assignee_id, status, deadline_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 30. Core Audit Events
CREATE TABLE IF NOT EXISTS core_audit_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id INT UNSIGNED NOT NULL,
  action VARCHAR(80) NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  details TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (actor_id) REFERENCES core_users(id),
  INDEX idx_core_audit_actor (actor_id, created_at),
  INDEX idx_core_audit_action (action, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 31. Core Idempotency Keys
CREATE TABLE IF NOT EXISTS core_idempotency_keys (
  actor_id INT UNSIGNED NOT NULL,
  request_key VARCHAR(80) NOT NULL,
  body_hash CHAR(64) NOT NULL,
  result_json MEDIUMTEXT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (actor_id, request_key),
  FOREIGN KEY (actor_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 31b. Core Private Binary Files (Project covers, Buyer 3x4 photos, Tazkira documents)
CREATE TABLE IF NOT EXISTS core_private_files (
  id CHAR(32) PRIMARY KEY,
  owner_id INT UNSIGNED NOT NULL,
  purpose VARCHAR(40) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  byte_size INT NOT NULL,
  content LONGBLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 31c. Core Migration Ledger & Branch Assignment Issues
CREATE TABLE IF NOT EXISTS core_migration_ledger (
  migration_key VARCHAR(100) PRIMARY KEY,
  applied_at DATETIME NOT NULL,
  notes VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS core_branch_assignment_issues (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  record_type VARCHAR(60) NOT NULL,
  record_id BIGINT UNSIGNED NOT NULL,
  issue_code VARCHAR(80) NOT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  UNIQUE KEY uq_branch_issue (record_type, record_id, issue_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Core RBAC Metadata
INSERT IGNORE INTO core_modules VALUES ('core','Shared application core',UTC_TIMESTAMP());
INSERT IGNORE INTO core_module_versions VALUES ('core',3,UTC_TIMESTAMP());
INSERT IGNORE INTO core_migration_ledger VALUES ('ceo_manager_branch_model_v1',UTC_TIMESTAMP(),'Canonical CEO/Manager roles and branch boundaries');

INSERT IGNORE INTO core_departments VALUES
  ('management','Management'),
  ('callcenter','Call Center'),
  ('sales','Sales Department'),
  ('production','Marketing and Production'),
  ('finance','Finance'),
  ('engineering','Engineering and Graphic Department');

INSERT IGNORE INTO core_roles VALUES
  ('ceo','management','CEO'),
  ('manager','management','Manager'),
  ('callcenter','callcenter','Call Center Agent'),
  ('sales_leader','sales','Sales Team Leader'),
  ('sales','sales','Sales Agent'),
  ('marketing_manager','production','Marketing Manager'),
  ('editor','production','Editor'),
  ('videographer','production','Videographer'),
  ('finance_manager','finance','Finance Manager'),
  ('architect','engineering','Architect'),
  ('graphic_designer','engineering','Graphic Designer'),
  ('visual_designer_3d','engineering','3D Visual Designer');

INSERT IGNORE INTO core_permissions VALUES
  ('core.tasks.read_own','core','Read and complete assigned management tasks'),
  ('core.tasks.assign','core','Assign management tasks'),
  ('core.staff.manage','core','Provision and deactivate operational staff'),
  ('core.departments.manage','core','Create and manage internal departments and staff roles'),
  ('core.submissions.read','core','Read website publishing submission status');

INSERT IGNORE INTO core_role_permissions
  SELECT code, 'core.tasks.read_own' FROM core_roles;

INSERT IGNORE INTO core_role_permissions VALUES
  ('manager','core.tasks.assign'),
  ('ceo','core.tasks.assign'),
  ('sales_leader','core.tasks.assign'),
  ('marketing_manager','core.tasks.assign'),
  ('finance_manager','core.tasks.assign'),
  ('ceo','core.staff.manage'),
  ('ceo','core.departments.manage'),
  ('manager','core.submissions.read'),
  ('ceo','core.submissions.read'),
  ('marketing_manager','core.submissions.read'),
  ('editor','core.submissions.read'),
  ('videographer','core.submissions.read'),
  ('finance_manager','core.submissions.read'),
  ('sales_leader','core.submissions.read'),
  ('sales','core.submissions.read'),
  ('callcenter','core.submissions.read');


-- ==============================================================================
-- PART C: CALL CENTER & SALES CRM MODULE TABLES (8 TABLES)
-- ==============================================================================

-- 32. Per-Agent Lead Serial Counters
CREATE TABLE IF NOT EXISTS cc_serial_counters (
  agent_id INT UNSIGNED PRIMARY KEY,
  next_number INT UNSIGNED NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 33. Call Center Customers
CREATE TABLE IF NOT EXISTS cc_customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  INDEX idx_cc_customers_phone (branch_id, phone),
  INDEX idx_cc_customers_name (branch_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 34. Call Center Leads
CREATE TABLE IF NOT EXISTS cc_leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id INT UNSIGNED NOT NULL,
  serial VARCHAR(80) NOT NULL UNIQUE,
  customer_id INT UNSIGNED NULL,
  customer_name VARCHAR(160) NOT NULL DEFAULT '',
  phone VARCHAR(20) NOT NULL,
  requirements TEXT NOT NULL,
  origin_agent_id INT UNSIGNED NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  status ENUM('draft','active','closed','lost') NOT NULL DEFAULT 'draft',
  call_at DATETIME NOT NULL,
  source ENUM('manual','provider') NOT NULL,
  provider_call_id VARCHAR(180) NULL UNIQUE,
  version INT NOT NULL DEFAULT 1,
  current_task_id INT UNSIGNED NULL,
  project_id INT UNSIGNED NULL,
  apartment_id INT UNSIGNED NULL,
  stage_code VARCHAR(2) NOT NULL DEFAULT 'L',
  property_kind ENUM('project','unit') NULL,
  property_id INT UNSIGNED NULL,
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (origin_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  INDEX idx_cc_leads_branch (branch_id, status, id),
  INDEX idx_cc_leads_origin (origin_agent_id, status, id),
  INDEX idx_cc_leads_assignee (assignee_id, status, id),
  INDEX idx_cc_leads_customer (customer_id),
  INDEX idx_lead_property (customer_id, property_kind, property_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 35. Follow-up Tasks (24-Hour SLA)
CREATE TABLE IF NOT EXISTS cc_followup_tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  scheduled_at DATETIME NOT NULL,
  deadline_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  late_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  notes TEXT NOT NULL,
  outcome VARCHAR(20) NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  INDEX idx_cc_followups_scheduled (assignee_id, completed_at, scheduled_at, id),
  INDEX idx_cc_followups_deadline (assignee_id, completed_at, deadline_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 36. Lead Activities Log
CREATE TABLE IF NOT EXISTS cc_lead_activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  actor_id INT UNSIGNED NOT NULL,
  type VARCHAR(40) NOT NULL,
  notes TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (actor_id) REFERENCES core_users(id),
  INDEX idx_cc_activities_lead (lead_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 37. Closed Deals (Sales Agent Closures)
CREATE TABLE IF NOT EXISTS cc_deal_closures (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL UNIQUE,
  sales_agent_id INT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  closed_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (sales_agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 38. Call Records
CREATE TABLE IF NOT EXISTS cc_calls (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL UNIQUE,
  agent_id INT UNSIGNED NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  call_at DATETIME NOT NULL,
  source ENUM('manual','provider') NOT NULL,
  provider_call_id VARCHAR(180) NULL UNIQUE,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (agent_id) REFERENCES core_users(id),
  INDEX idx_cc_calls_agent_time (agent_id, call_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 39. Provider Events Inbox
CREATE TABLE IF NOT EXISTS cc_provider_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(60) NOT NULL,
  external_event_id VARCHAR(180) NOT NULL,
  received_at DATETIME NOT NULL,
  processed_at DATETIME NULL,
  status ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
  payload MEDIUMTEXT NOT NULL,
  UNIQUE KEY uq_cc_provider_event (provider, external_event_id),
  INDEX idx_cc_provider_status_time (status, received_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Call Center RBAC Metadata
INSERT IGNORE INTO core_modules VALUES ('callcenter','Call Center',UTC_TIMESTAMP());
INSERT IGNORE INTO core_module_versions VALUES ('callcenter',1,UTC_TIMESTAMP());

INSERT IGNORE INTO core_permissions VALUES
  ('callcenter.access','callcenter','Access scoped call-center workspace'),
  ('callcenter.manage','callcenter','Read call-center records for management');

INSERT IGNORE INTO core_role_permissions VALUES
  ('callcenter','callcenter.access'),
  ('sales','callcenter.access'),
  ('sales_leader','callcenter.access'),
  ('manager','callcenter.access'),
  ('manager','callcenter.manage'),
  ('ceo','callcenter.access'),
  ('ceo','callcenter.manage');


-- ==============================================================================
-- PART D: PRE-SALE INVENTORY, SALES CRM, HR CONTRACTS, FINANCE & ENGINEERING
-- (INTERNAL OFFICE CRM DATABASE — TEXT & NUMERIC ONLY, NO WEBSITE IMAGE LINKS)
-- ==============================================================================

-- 40. Pre-Sale Projects (CEO Inventory)
CREATE TABLE IF NOT EXISTS inv_projects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id INT UNSIGNED NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  total_area_sqm DECIMAL(12,2) NOT NULL DEFAULT 0,
  floors INT UNSIGNED NOT NULL DEFAULT 1,
  commercial_floors_json TEXT NULL,
  residential_floors_json TEXT NULL,
  corridor_count INT NOT NULL DEFAULT 1,
  cover_photo_url VARCHAR(500) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'presale',
  assigned_team_leader_id INT UNSIGNED NULL,
  created_by INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  FOREIGN KEY (assigned_team_leader_id) REFERENCES core_users(id),
  FOREIGN KEY (created_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 41. Project Sellers (Multiple Owners/Sellers per Project)
CREATE TABLE IF NOT EXISTS inv_project_sellers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  father_name VARCHAR(160) NOT NULL DEFAULT '',
  grandfather_name VARCHAR(160) NOT NULL DEFAULT '',
  tazkira_number VARCHAR(80) NOT NULL,
  phone VARCHAR(40) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  share_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  photo_3x4_url VARCHAR(500) NOT NULL DEFAULT '',
  details_json TEXT NULL,
  FOREIGN KEY (project_id) REFERENCES inv_projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 42. Construction Company Details per Project
CREATE TABLE IF NOT EXISTS inv_construction_companies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL UNIQUE,
  company_name VARCHAR(180) NOT NULL,
  license_number VARCHAR(80) NOT NULL DEFAULT '',
  representative_name VARCHAR(160) NOT NULL,
  representative_father_name VARCHAR(160) NOT NULL DEFAULT '',
  representative_tazkira VARCHAR(80) NOT NULL DEFAULT '',
  phone VARCHAR(40) NOT NULL DEFAULT '',
  address VARCHAR(255) NOT NULL DEFAULT '',
  representative_photo_url VARCHAR(500) NOT NULL DEFAULT '',
  details_json TEXT NULL,
  FOREIGN KEY (project_id) REFERENCES inv_projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 43. Project Apartments (4 Boundaries, Direction, Sqm Price)
CREATE TABLE IF NOT EXISTS inv_apartments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  unit_number VARCHAR(40) NOT NULL,
  serial_number VARCHAR(80) NOT NULL UNIQUE,
  kind VARCHAR(20) NOT NULL DEFAULT 'apartment',
  corridor VARCHAR(20) NOT NULL DEFAULT 'A',
  floor INT NOT NULL,
  rooms INT UNSIGNED NOT NULL DEFAULT 3,
  area_sqm DECIMAL(10,2) NOT NULL,
  roof_area_sqm DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_vip TINYINT NOT NULL DEFAULT 0,
  direction VARCHAR(80) NOT NULL,
  boundary_north VARCHAR(180) NOT NULL,
  boundary_south VARCHAR(180) NOT NULL,
  boundary_east VARCHAR(180) NOT NULL,
  boundary_west VARCHAR(180) NOT NULL,
  price_per_sqm DECIMAL(14,2) NOT NULL,
  total_price DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  status ENUM('available','reserved','deal_closed','sold') NOT NULL DEFAULT 'available',
  version INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_inv_project_unit (project_id, unit_number),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 44. Project Sales Agent Assignments
CREATE TABLE IF NOT EXISTS inv_project_sales_agents (
  project_id INT UNSIGNED NOT NULL,
  sales_agent_id INT UNSIGNED NOT NULL,
  assigned_by INT UNSIGNED NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, sales_agent_id),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (sales_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 44b. Master Customer Ownership
CREATE TABLE IF NOT EXISTS crm_customer_owners (
  customer_id INT UNSIGNED PRIMARY KEY,
  serial VARCHAR(80) NOT NULL UNIQUE,
  owner_agent_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (owner_agent_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 44c. Customer Shared Access
CREATE TABLE IF NOT EXISTS crm_customer_shared_access (
  customer_id INT UNSIGNED NOT NULL,
  agent_id INT UNSIGNED NOT NULL,
  granted_by INT UNSIGNED NOT NULL,
  reason VARCHAR(120) NOT NULL DEFAULT 'referral',
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, agent_id),
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (agent_id) REFERENCES core_users(id),
  FOREIGN KEY (granted_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 44d. Lead Referrals
CREATE TABLE IF NOT EXISTS crm_lead_referrals (
  lead_id INT UNSIGNED NOT NULL,
  shared_agent_id INT UNSIGNED NOT NULL,
  referred_by_id INT UNSIGNED NOT NULL,
  project_id INT UNSIGNED NULL,
  apartment_id INT UNSIGNED NULL,
  referred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (lead_id, shared_agent_id),
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (shared_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (referred_by_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 45. Customer Duplicate Review Requests
CREATE TABLE IF NOT EXISTS crm_customer_review_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  phone VARCHAR(20) NOT NULL,
  requesting_agent_id INT UNSIGNED NOT NULL,
  submitted_name VARCHAR(160) NOT NULL,
  submitted_requirements TEXT NOT NULL,
  status ENUM('pending_review','approved_shared','rejected') NOT NULL DEFAULT 'pending_review',
  reviewed_by INT UNSIGNED NULL,
  manager_note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (requesting_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (reviewed_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 46. Sales Deal Closures & HR Contract Handoffs
CREATE TABLE IF NOT EXISTS crm_deal_handoffs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL UNIQUE,
  deal_serial VARCHAR(100) NOT NULL UNIQUE,
  sales_agent_id INT UNSIGNED NOT NULL,
  project_id INT UNSIGNED NOT NULL,
  apartment_id INT UNSIGNED NOT NULL,
  agreed_amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  buyer_photo_url VARCHAR(500) NOT NULL,
  tazkira_photo_url VARCHAR(500) NOT NULL,
  hr_status ENUM('pending_contract','contract_issued') NOT NULL DEFAULT 'pending_contract',
  closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id),
  FOREIGN KEY (sales_agent_id) REFERENCES core_users(id),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (apartment_id) REFERENCES inv_apartments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 47. HR Bilingual Apartment Contracts
CREATE TABLE IF NOT EXISTS hr_contracts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_serial VARCHAR(100) NOT NULL UNIQUE,
  deal_handoff_id INT UNSIGNED NULL,
  project_id INT UNSIGNED NOT NULL,
  apartment_id INT UNSIGNED NOT NULL,
  sellers_snapshot_json MEDIUMTEXT NOT NULL,
  construction_snapshot_json MEDIUMTEXT NOT NULL,
  apartment_snapshot_json MEDIUMTEXT NOT NULL,
  price_per_sqm DECIMAL(14,2) NOT NULL,
  total_price DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  sales_agent_name VARCHAR(160) NOT NULL DEFAULT '',
  gregorian_date DATE NOT NULL,
  jalali_date VARCHAR(40) NOT NULL,
  clauses_json MEDIUMTEXT NOT NULL,
  notes TEXT NOT NULL,
  status ENUM('draft','issued','amended','cancelled') NOT NULL DEFAULT 'issued',
  amendment_version INT UNSIGNED NOT NULL DEFAULT 1,
  verification_token CHAR(64) NULL UNIQUE,
  issued_by INT UNSIGNED NOT NULL,
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (deal_handoff_id) REFERENCES crm_deal_handoffs(id),
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (apartment_id) REFERENCES inv_apartments(id),
  FOREIGN KEY (issued_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 48. HR Contract Buyers (Multiple Co-Buyers Supported)
CREATE TABLE IF NOT EXISTS hr_contract_buyers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  father_name VARCHAR(160) NOT NULL,
  grandfather_name VARCHAR(160) NOT NULL DEFAULT '',
  tazkira_number VARCHAR(80) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address VARCHAR(255) NOT NULL,
  photo_3x4_url VARCHAR(500) NOT NULL,
  tazkira_photo_url VARCHAR(500) NULL,
  details_json TEXT NULL,
  FOREIGN KEY (contract_id) REFERENCES hr_contracts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 48b. HR Contract Amendment Revisions
CREATE TABLE IF NOT EXISTS hr_contract_revisions (
  contract_id INT UNSIGNED NOT NULL,
  amendment_version INT UNSIGNED NOT NULL,
  snapshot_json MEDIUMTEXT NOT NULL,
  reason TEXT NOT NULL,
  actor_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contract_id, amendment_version),
  FOREIGN KEY (contract_id) REFERENCES hr_contracts(id),
  FOREIGN KEY (actor_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 49. HR Contract Installment Schedule (100% Reconciled)
CREATE TABLE IF NOT EXISTS hr_contract_installments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_id INT UNSIGNED NOT NULL,
  installment_number INT UNSIGNED NOT NULL,
  description VARCHAR(180) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  due_date DATE NULL,
  scheduled_amount DECIMAL(14,2) NOT NULL,
  paid_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending','partially_paid','paid','overdue') NOT NULL DEFAULT 'pending',
  UNIQUE KEY uq_hr_contract_inst (contract_id, installment_number),
  FOREIGN KEY (contract_id) REFERENCES hr_contracts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 50. Finance Installment Deposits (Maker-Checker Post/Reverse)
CREATE TABLE IF NOT EXISTS fin_deposits (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contract_id INT UNSIGNED NOT NULL,
  installment_id INT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  payment_method ENUM('Cash','Bank Transfer','Cheque') NOT NULL DEFAULT 'Cash',
  receipt_number VARCHAR(80) NOT NULL,
  notes TEXT NOT NULL,
  status ENUM('draft','posted','returned','reversed') NOT NULL DEFAULT 'draft',
  reversal_reason TEXT NULL,
  payment_date DATE NULL,
  receipt_paid_to_date DECIMAL(14,2) NULL,
  receipt_remaining_balance DECIMAL(14,2) NULL,
  entered_by INT UNSIGNED NOT NULL,
  approved_by INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  posted_at DATETIME NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (contract_id) REFERENCES hr_contracts(id),
  FOREIGN KEY (installment_id) REFERENCES hr_contract_installments(id),
  FOREIGN KEY (entered_by) REFERENCES core_users(id),
  FOREIGN KEY (approved_by) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 51. Marketing & Media Production Entries
CREATE TABLE IF NOT EXISTS mkt_production_entries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  branch_id INT UNSIGNED NOT NULL,
  customer_name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  property_type ENUM('Villa','Block','Building','Apartment') NOT NULL,
  submitted_by_id INT UNSIGNED NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  filming_date DATE NULL,
  videographer_id INT UNSIGNED NULL,
  filming_completed_at DATETIME NULL,
  editing_deadline_at DATE NULL,
  editor_id INT UNSIGNED NULL,
  content_type VARCHAR(120) NULL,
  serial_number VARCHAR(80) NULL UNIQUE,
  property_info_note TEXT NULL,
  photos_json MEDIUMTEXT NULL,
  platform ENUM('Facebook','YouTube','Instagram') NULL,
  stage ENUM('submitted','filming_scheduled','filming_completed','editing_scheduled','ready_for_post','posted') NOT NULL DEFAULT 'submitted',
  submission_post_id INT UNSIGNED NULL,
  version INT NOT NULL DEFAULT 1,
  FOREIGN KEY (branch_id) REFERENCES core_branches(id),
  FOREIGN KEY (submitted_by_id) REFERENCES core_users(id),
  FOREIGN KEY (videographer_id) REFERENCES core_users(id),
  FOREIGN KEY (editor_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 52. Engineering Deliverables & Version History
CREATE TABLE IF NOT EXISTS eng_deliverables (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id INT UNSIGNED NOT NULL,
  apartment_id INT UNSIGNED NULL,
  title VARCHAR(200) NOT NULL,
  assigned_role ENUM('architect','graphic_designer','visual_designer_3d') NOT NULL,
  assignee_id INT UNSIGNED NOT NULL,
  assigned_by_id INT UNSIGNED NOT NULL,
  deadline_at DATETIME NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES inv_projects(id),
  FOREIGN KEY (apartment_id) REFERENCES inv_apartments(id),
  FOREIGN KEY (assignee_id) REFERENCES core_users(id),
  FOREIGN KEY (assigned_by_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS eng_deliverable_versions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  deliverable_id INT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  format VARCHAR(100) NOT NULL,
  notes TEXT NOT NULL,
  submitted_by_id INT UNSIGNED NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('submitted','approved','revision_requested') NOT NULL DEFAULT 'submitted',
  reviewer_comment TEXT NULL,
  reviewed_by_id INT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  UNIQUE KEY uq_eng_deliv_version (deliverable_id, version_number),
  FOREIGN KEY (deliverable_id) REFERENCES eng_deliverables(id),
  FOREIGN KEY (submitted_by_id) REFERENCES core_users(id),
  FOREIGN KEY (reviewed_by_id) REFERENCES core_users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 52b. Marketing Outbox, Phone Registry & Customer Property Lead Claims
CREATE TABLE IF NOT EXISTS mkt_submission_outbox (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entry_id INT UNSIGNED NOT NULL UNIQUE,
  payload_json MEDIUMTEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entry_id) REFERENCES mkt_production_entries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_phone_registry (
  phone VARCHAR(20) PRIMARY KEY,
  customer_id INT UNSIGNED NULL,
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_customer_property_leads (
  customer_id INT UNSIGNED NOT NULL,
  property_kind ENUM('project','unit') NOT NULL,
  property_id INT UNSIGNED NOT NULL,
  lead_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (customer_id, property_kind, property_id),
  UNIQUE KEY uq_property_lead (lead_id),
  FOREIGN KEY (customer_id) REFERENCES cc_customers(id),
  FOREIGN KEY (lead_id) REFERENCES cc_leads(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS crm_lead_property_readiness (
  id TINYINT PRIMARY KEY,
  enabled TINYINT NOT NULL DEFAULT 0,
  checked_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO crm_lead_property_readiness (id, enabled, checked_at)
SELECT 1, IF((SELECT COUNT(*) FROM cc_leads)=0 AND (SELECT COUNT(*) FROM cc_customers)=0, 1, 0), UTC_TIMESTAMP();

-- Seed Inventory, Sales CRM, HR/Finance, Marketing, Engineering Modules & Canonical Permissions
INSERT IGNORE INTO core_modules VALUES
  ('inventory','Pre-Sale Project and Apartment Inventory',UTC_TIMESTAMP()),
  ('sales_crm','Sales Pipeline and Customer Deduplication',UTC_TIMESTAMP()),
  ('hr_finance','HR Contracts and Finance Installment Ledger',UTC_TIMESTAMP()),
  ('marketing','Marketing and Media Production Workflow',UTC_TIMESTAMP()),
  ('engineering','Engineering and Graphic Deliverables',UTC_TIMESTAMP());

INSERT IGNORE INTO core_module_versions VALUES
  ('inventory',1,UTC_TIMESTAMP()),
  ('sales_crm',1,UTC_TIMESTAMP()),
  ('hr_finance',1,UTC_TIMESTAMP()),
  ('marketing',1,UTC_TIMESTAMP()),
  ('engineering',1,UTC_TIMESTAMP());

INSERT IGNORE INTO core_permissions VALUES
  ('inventory.read','inventory','Read pre-sale project and apartment inventory'),
  ('inventory.manage','inventory','Create and update pre-sale projects, sellers, and apartments'),
  ('sales.access','sales_crm','Access Sales CRM leads, follow-ups, visits, and deals'),
  ('sales.team_manage','sales_crm','Supervise assigned Sales Agents as Sales Team Leader'),
  ('customers.review_duplicates','sales_crm','Review and resolve duplicate customer access requests'),
  ('hr.contracts.manage','hr_finance','Create, issue, print, and amend bilingual apartment sale contracts'),
  ('hr.preparation.manage','hr_finance','Prepare sellers and apartment boundaries'),
  ('finance.read','hr_finance','Read contract installment schedules and deposit ledgers'),
  ('finance.deposit.draft','hr_finance','Prepare draft customer installment deposits'),
  ('finance.deposit.approve','hr_finance','Approve, post, return, and reverse customer deposits'),
  ('marketing.submit_property','marketing','Submit property entries for Marketing filming and production'),
  ('marketing.schedule_filming','marketing','Schedule filming dates and assign Videographers'),
  ('marketing.complete_filming','marketing','Mark property filming completed'),
  ('marketing.edit_and_post','marketing','Schedule editing, set content type, and mark Posted with 5 photos'),
  ('engineering.deliverables.submit','engineering','Upload versioned architectural, graphic, and 3D deliverables'),
  ('engineering.deliverables.review','engineering','Review, approve, or request revisions on Engineering deliverables');

INSERT IGNORE INTO core_role_permissions VALUES
  ('ceo','inventory.read'),('ceo','inventory.manage'),('ceo','sales.access'),('ceo','sales.team_manage'),
  ('ceo','customers.review_duplicates'),('ceo','finance.read'),('ceo','marketing.submit_property'),('ceo','engineering.deliverables.review'),
  ('manager','inventory.read'),('manager','sales.access'),('manager','sales.team_manage'),('manager','customers.review_duplicates'),
  ('manager','hr.contracts.manage'),('manager','hr.preparation.manage'),('manager','marketing.submit_property'),
  ('sales_leader','inventory.read'),('sales_leader','sales.access'),('sales_leader','sales.team_manage'),('sales_leader','marketing.submit_property'),
  ('sales','inventory.read'),('sales','sales.access'),('sales','marketing.submit_property'),
  ('callcenter','inventory.read'),('callcenter','marketing.submit_property'),
  ('finance_manager','inventory.read'),('finance_manager','finance.read'),('finance_manager','finance.deposit.draft'),('finance_manager','finance.deposit.approve'),
  ('marketing_manager','marketing.submit_property'),('marketing_manager','marketing.schedule_filming'),('marketing_manager','marketing.complete_filming'),
  ('videographer','marketing.complete_filming'),
  ('editor','marketing.edit_and_post'),
  ('architect','inventory.read'),('architect','engineering.deliverables.submit'),
  ('graphic_designer','inventory.read'),('graphic_designer','engineering.deliverables.submit'),
  ('visual_designer_3d','inventory.read'),('visual_designer_3d','engineering.deliverables.submit');


-- ==============================================================================
-- PART E: ISOLATED THIRD SUBMISSION DATABASE (BRIDGE BETWEEN MARKETING & ADMIN)
-- UDR-001/002/003: Admin reads/updates status here and publishes to Website DB;
-- Internal Staff reads status here; Admin NEVER accesses Internal CRM DB.
-- ==============================================================================

-- 53. Submitted Posts for Website Publishing
CREATE TABLE IF NOT EXISTS sub_posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  origin_branch_id INT UNSIGNED NOT NULL,
  marketing_entry_id INT UNSIGNED NOT NULL UNIQUE,
  serial_number VARCHAR(80) NOT NULL UNIQUE,
  customer_name VARCHAR(160) NOT NULL,
  address VARCHAR(255) NOT NULL,
  property_type ENUM('Villa','Block','Building','Apartment') NOT NULL,
  property_info_note TEXT NOT NULL,
  social_platform ENUM('Facebook','YouTube','Instagram') NOT NULL,
  publish_status ENUM('Submitted','Approved','Published','Rejected') NOT NULL DEFAULT 'Submitted',
  rejection_reason TEXT NULL,
  submitted_by_name VARCHAR(160) NOT NULL,
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  published_at DATETIME NULL,
  website_property_id INT UNSIGNED NULL,
  version INT NOT NULL DEFAULT 1,
  INDEX idx_sub_posts_status (origin_branch_id, publish_status, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 54. Submitted Post Five Photos
CREATE TABLE IF NOT EXISTS sub_post_photos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sub_post_id INT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL,
  photo_url VARCHAR(500) NOT NULL,
  UNIQUE KEY uq_sub_photo_order (sub_post_id, sort_order),
  FOREIGN KEY (sub_post_id) REFERENCES sub_posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 55. Submission Status Audit Trail
CREATE TABLE IF NOT EXISTS sub_publish_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sub_post_id INT UNSIGNED NOT NULL,
  actor_role VARCHAR(60) NOT NULL,
  previous_status VARCHAR(40) NULL,
  next_status VARCHAR(40) NOT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sub_post_id) REFERENCES sub_posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 56. Copied Submission Binary Assets
CREATE TABLE IF NOT EXISTS sub_post_assets (
  sub_post_id INT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL,
  mime VARCHAR(100) NOT NULL,
  content LONGBLOB NOT NULL,
  PRIMARY KEY (sub_post_id, sort_order),
  FOREIGN KEY (sub_post_id) REFERENCES sub_posts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 57. Digital Vault Folders
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

-- 58. Digital Vault Files
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

SET FOREIGN_KEY_CHECKS = 1;
