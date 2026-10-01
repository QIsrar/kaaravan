# Kaaravan Migrations Index

Chronological log of all database migrations for the Kaaravan platform.

| Date | Migration File | Description |
| :--- | :--- | :--- |
| 2026-09-25 | `20260925000000_initial_schema.sql` | Establishes the foundational PostgreSQL database schema including domain enums, tables, relationships, RLS policies, and timestamp triggers. |
| 2026-09-25 | `20260925000001_phase3_security.sql` | Implements the Phase 3 security hardening layer with the private schema, stricter RLS isolation, audit logging triggers, and role verification functions. |
| 2026-09-25 | `20260925000002_phase3_security_fixes.sql` | Hardens database security by revoking private schema usage from the anonymous role and dropping permissive public storage SELECT policies. |
| 2026-09-25 | `20260925130406_phase3_security_fixes.sql` | Empty placeholder migration created during Phase 3 security refinement (no changes). |
| 2026-09-29 | `20260929120000_search_products_function.sql` | Introduces the `search_products` RPC for secure, parameterized full-text and typo-tolerant trigram product searches. |
| 2026-09-30 | `20260930090000_upsert_cart_item_function.sql` | Implements the high-performance `upsert_cart_item` single-trip RPC and unique profile cart constraint to eliminate sequential multi-hop cart latency. |
| 2026-09-30 | `20260930100000_customer_accounts.sql` | Phase 5 Part 1: Adds wishlists, account deletion requests with RLS, and triggers for rating recalculation on reviews. |
| 2026-10-01 | `20261001172011_phase6_seller_portal.sql` | Phase 6: Adds seller portal RPCs, auth integrations, RLS adjustments, and low_stock_threshold to product_variants. |
