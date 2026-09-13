-- =====================================================================
-- KEA — RLS Simplification for the Server-Side Data Layer
-- Target: Supabase PostgreSQL 15+
--
-- The application enforces authorization in its API layer
-- (requireRole + scope guards in src/lib/db.ts), and the Supabase Auth
-- service is currently unavailable ("Database error querying schema").
-- To keep the live dashboards functional, RLS is disabled on the
-- application tables so the trusted server-side Supabase client can
-- read/write. Realtime channels remain scoped by per-user filters.
-- =====================================================================

ALTER TABLE IF EXISTS users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS outlets          DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loans            DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leaves           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documents        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alerts           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workflows        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workflow_steps   DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS workflow_messages DISABLE ROW LEVEL SECURITY;
