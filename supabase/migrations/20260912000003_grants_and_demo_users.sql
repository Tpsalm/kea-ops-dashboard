-- =====================================================================
-- KEA — Grants, Schema Reconciliation & Demo Users
-- Target: Supabase PostgreSQL 15+
--
-- Fixes the live-production failures:
--   1. `anon` / `authenticated` roles had no table privileges
--      ("permission denied for table users"), which broke every API route.
--   2. The `users` table may have been created by a minimal bootstrap
--      script missing the columns the app requires — reconcile additively.
--   3. Demo accounts (used by the login fallback) had no matching
--      public.users rows, so they could never resolve to a real user id.
--   4. Restore Auth-service privileges in case the auth schema lost them
--      ("Database error querying schema" from GoTrue).
-- =====================================================================

BEGIN;

-- ──────────────────────── 1. POSTGREST GRANTS ────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
    TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public
    TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public
    TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES
    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES
    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS
    TO anon, authenticated, service_role;

-- ──────────────────────── 2. USERS TABLE RECONCILIATION ──────────────
-- Additive only: if the minimal bootstrap created `users`, backfill the
-- columns the application reads/writes. No-op when they already exist.
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS supervisor_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'KEA User';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lga TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS territory TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS loan_debt NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ──────────────────────── 3. DEMO ACCOUNTS ───────────────────────────
-- Fixed UUIDs so the demo login fallback can resolve to stable rows with
-- correct supervisor assignments (Supervisor ⇄ VSR/Merchandiser).
INSERT INTO users (id, email, name, role, status, client_id, supervisor_id, loan_debt)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'superadmin@kea.com',  'Super Admin Executive',  'super_admin',  'active', NULL, NULL, 0),
  ('10000000-0000-0000-0000-000000000002', 'admin@kea.com',       'KEA Administrator',      'super_admin',  'active', NULL, NULL, 0),
  ('20000000-0000-0000-0000-000000000001', 'supervisor@kea.com',  'Michael Olayiwola',      'supervisor',   'active', NULL, NULL, 0),
  ('30000000-0000-0000-0000-000000000001', 'vsr@kea.com',         'Babatunde Adeleke',      'vsr',          'active', NULL, '20000000-0000-0000-0000-000000000001', 0),
  ('30000000-0000-0000-0000-000000000002', 'merchandiser@kea.com','Maria Uchechukwu',       'merchandiser', 'active', NULL, '20000000-0000-0000-0000-000000000001', 0),
  ('40000000-0000-0000-0000-000000000001', 'tsr@kea.com',         'Emeka Nwosu',            'tsr',          'active', NULL, NULL, 0)
ON CONFLICT (email) DO UPDATE SET
  role          = EXCLUDED.role,
  name          = EXCLUDED.name,
  status        = EXCLUDED.status,
  supervisor_id = EXCLUDED.supervisor_id;

-- ──────────────────────── 4. AUTH SCHEMA PRIVILEGE REPAIR ────────────
-- Defensive: if the auth schema still exists but lost grants, restore them.
-- Wrapped so a missing auth schema never blocks the rest of this migration.
DO $$
BEGIN
    GRANT USAGE ON SCHEMA auth TO supabase_auth_admin;
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth
        GRANT ALL ON TABLES TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth
        GRANT ALL ON SEQUENCES TO supabase_auth_admin;
    ALTER DEFAULT PRIVILEGES IN SCHEMA auth
        GRANT ALL ON FUNCTIONS TO supabase_auth_admin;
EXCEPTION
    WHEN invalid_schema_name THEN NULL;
    WHEN insufficient_privilege THEN NULL;
    WHEN undefined_table THEN NULL;
END $$;

COMMIT;
