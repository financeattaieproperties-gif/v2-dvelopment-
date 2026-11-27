-- V2 WEBSITE database ONLY. Non-destructive publishing retry ledger.
CREATE TABLE IF NOT EXISTS website_submission_publications (
 submission_id INT UNSIGNED PRIMARY KEY,
 property_id INT NOT NULL UNIQUE,
 published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_website_sub_pub_prop FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
