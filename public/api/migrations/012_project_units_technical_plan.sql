-- V2 website database only. Back up first and verify SELECT DATABASE().
-- Adds dedicated technical_plan_url column to project_units (preserving legacy [TECHNICAL_PLAN: ...] fallback).
-- ROLLBACK: ALTER TABLE project_units DROP COLUMN technical_plan_url;

ALTER TABLE project_units
  ADD COLUMN technical_plan_url VARCHAR(512) NULL DEFAULT NULL AFTER video_url;
