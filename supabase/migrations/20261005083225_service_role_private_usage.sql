-- Migration: 20261005083225_service_role_private_usage.sql
-- Fix: Grant USAGE on schema private and EXECUTE on specific private functions to service_role.
--
-- Bug explanation:
-- In migration 20260925000001_phase3_security.sql, USAGE on schema private was granted only to
-- 'anon' and 'authenticated', but omitted 'service_role'. Furthermore, migration 
-- 20261001202644_phase6_seller_catalog.sql moved record_price_history() to schema private and
-- revoked EXECUTE from PUBLIC, anon, and authenticated without explicitly granting it to service_role.
--
-- In PostgreSQL, when the Supabase service_role client executes DML (such as updating products or variants),
-- BEFORE/AFTER triggers (e.g. prevent_product_escalation, prevent_variant_escalation, record_price_history)
-- fire in the context of the service_role user. Because service_role is not a superuser (it has BYPASSRLS
-- but remains subject to schema permissions), missing USAGE on schema private or missing EXECUTE on trigger
-- functions resulted in "permission denied for schema private" or function execution errors.
--
-- This migration grants USAGE on schema private to service_role, and grants EXECUTE only on the
-- specific private functions that triggers and policies call during service-role writes and operations.

GRANT USAGE ON SCHEMA private TO service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM service_role;

-- 1. Product & Variant triggers (called during product/variant upsert and stock/price updates)
GRANT EXECUTE ON FUNCTION private.prevent_product_escalation() TO service_role;
GRANT EXECUTE ON FUNCTION private.prevent_variant_escalation() TO service_role;
GRANT EXECUTE ON FUNCTION private.record_price_history() TO service_role;

-- 2. User & Seller profile triggers (called during profile/seller status updates and auth creation)
GRANT EXECUTE ON FUNCTION private.prevent_role_escalation() TO service_role;
GRANT EXECUTE ON FUNCTION private.prevent_seller_escalation() TO service_role;
GRANT EXECUTE ON FUNCTION private.handle_new_user() TO service_role;

-- 3. Seller onboarding & compliance triggers (called during document, bank, and proof verification)
GRANT EXECUTE ON FUNCTION private.prevent_seller_doc_escalation() TO service_role;
GRANT EXECUTE ON FUNCTION private.prevent_seller_bank_escalation() TO service_role;
GRANT EXECUTE ON FUNCTION private.prevent_proof_escalation() TO service_role;

-- 4. Review & Rating triggers (called during review moderation and rating recomputation)
GRANT EXECUTE ON FUNCTION private.prevent_review_escalation() TO service_role;
GRANT EXECUTE ON FUNCTION private.recalculate_ratings() TO service_role;

-- 5. Helper functions called in triggers and RLS policies
GRANT EXECUTE ON FUNCTION private.is_superadmin() TO service_role;
GRANT EXECUTE ON FUNCTION private.current_seller_id() TO service_role;
GRANT EXECUTE ON FUNCTION private.has_permission(text) TO service_role;
GRANT EXECUTE ON FUNCTION private.qafila_participant_count(UUID) TO service_role;
