# Kaaravan Workflow & Standing Procedures

These procedures must be followed in every phase of development.

## MIGRATIONS
- Every new migration gets a short descriptive name (`pnpm dlx supabase migration new <name>`) and a line in `docs/MIGRATIONS.md`.
- Never edit a pushed migration. Every schema change is a NEW file in `supabase/migrations` with a later timestamp.
- Every new table: RLS enabled in the same migration, default deny, policies following the patterns in the Phase 3 migration (`private.is_superadmin()`, `private.current_seller_id()`, `private.has_permission()`, `(select auth.uid())`).
- Before pushing, dry-run on the linked DB without Docker: create `scratch/dry_run_<name>.sql` containing:
  ```sql
  BEGIN; 
  CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions; 
  <new migration>; 
  CREATE TEMP TABLE test_results (result text); 
  GRANT ALL ON TABLE test_results TO anon, authenticated, postgres; 
  <all tests from supabase/tests/rls_test.sql plus new ones, each written as INSERT INTO test_results SELECT ...>; 
  SELECT * FROM test_results; 
  ROLLBACK;
  ```
  Run: `pnpm dlx supabase db query --linked -f scratch/dry_run_<name>.sql` and paste the COMPLETE raw output. Every line must be "ok"; exit code 0 alone proves nothing.
- Add new tests for new tables/rules to `supabase/tests/rls_test.sql`.
- Push only after approval: `pnpm dlx supabase db push`. Never run `seed.sql` or `--include-seed` against the remote DB.
- After every push: `pnpm gen:types`, then `pnpm build`.

## SERVICES AND API (rule 19)
- Business logic in `lib/services/<domain>.ts`; web server actions are thin wrappers; every write also gets an `/api/v1` route with Bearer auth; document each endpoint in `docs/API.md` in the same phase.
- Services that must act across users (guest carts, guest order lookup, approvals, status changes) use the server-only admin client and do their own authorization checks, then write `audit_logs`.

## IP BASELINE (One Tech and AI)
- New core files (`lib/services`, `lib/auth`, `lib/supabase`, business logic) start with the copyright header (rule 20).
- Public pages keep the store footer (copyright + Terms, Privacy, IP Notice links); `/seller`, `/admin`, `/sell` and login/sign-up pages show the portal notice (`legal.portalCopyright`).
- Never put secrets in code or database columns. If hosting, environments or access change, update `docs/ASSET_RECORD.md`.

## END OF PHASE
- Run `pnpm build` and `pnpm lint`; fix everything.
- Report: files changed, migrations added, new `/api/v1` endpoints, manual steps for me, anything you were unsure about.
- Check `docs/ARCHITECTURE.md` "Deferred security items" for this phase and confirm each is done.
