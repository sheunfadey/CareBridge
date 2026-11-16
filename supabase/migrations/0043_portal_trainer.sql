-- =============================================================================
-- CareBridge - Trainer portal mode
-- Migration: 0043_portal_trainer.sql
-- =============================================================================

alter type portal_mode add value if not exists 'trainer';
