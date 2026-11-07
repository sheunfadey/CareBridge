-- =============================================================================
-- CareBridge - Additional course resource types
-- Migration: 0038_course_resource_types.sql
-- =============================================================================

alter type learning_resource_kind add value if not exists 'spreadsheet';
alter type learning_resource_kind add value if not exists 'zip';
