-- =====================================================================
-- KEA Bidirectional Event-Driven Workflow — Governance, RLS & Enum Hardening
-- Target: Supabase PostgreSQL 15+
-- Additive only — no existing tables, columns, or policies are dropped.
--
-- Closes the security gaps of migration 001:
--   1. Extends alert enums to match the event types emitted by the API layer.
--   2. Adds Super Admin universal visibility for full executive governance.
--   3. Adds coherent RLS policies for the workflow-adjacent core tables
--      (users, alerts, documents, loans, leaves, outlets) so that the
--      dashboard works end-to-end with RLS enabled.
-- =====================================================================

BEGIN;

-- ──────────────────────── 1. ENUM HARDENING ────────────────────────
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'pod_submission';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'field_report_submission';
ALTER TYPE alert_type ADD VALUE IF NOT EXISTS 'alert_resolution';

ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'reviewed';
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'escalated';

-- ──────────────────────── 2. HELPER FUNCTIONS ────────────────────────
-- SECURITY DEFINER helpers run as the table owner and therefore bypass RLS.
-- This avoids infinite-recursion traps in self-referencing users policies.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::text FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor');
$$;

-- ──────────────────────── 3. WORKFLOW updated_at MAINTENANCE ────────
CREATE OR REPLACE FUNCTION fn_touch_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workflows_updated_at ON workflows;
CREATE TRIGGER trg_workflows_updated_at
BEFORE UPDATE ON workflows
FOR EACH ROW EXECUTE FUNCTION fn_touch_workflows_updated_at();

-- ──────────────────────── 4. GOVERNANCE RLS (workflow tables) ────────
-- Super Admin must see and act on every workflow regardless of escalation
-- assignment. These policies are additive to the scoped policies in 001.
DROP POLICY IF EXISTS workflows_select_super_admin ON workflows;
CREATE POLICY workflows_select_super_admin ON workflows FOR SELECT
USING (public.is_super_admin());

DROP POLICY IF EXISTS workflows_update_super_admin ON workflows;
CREATE POLICY workflows_update_super_admin ON workflows FOR UPDATE
USING (public.is_super_admin());

DROP POLICY IF EXISTS workflow_steps_select_super_admin ON workflow_steps;
CREATE POLICY workflow_steps_select_super_admin ON workflow_steps FOR SELECT
USING (public.is_super_admin());

DROP POLICY IF EXISTS workflow_messages_select_super_admin ON workflow_messages;
CREATE POLICY workflow_messages_select_super_admin ON workflow_messages FOR SELECT
USING (public.is_super_admin());

-- ──────────────────────── 5. USERS RLS ────────────────────────
-- Self, direct supervisor, direct TSR, and Super Admin visibility.
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT
USING (
    id = auth.uid()
    OR supervisor_id = auth.uid()
    OR tsr_id = auth.uid()
    OR public.is_super_admin()
);

-- Self signup profile creation (id = auth.uid()) or onboarding by management.
DROP POLICY IF EXISTS users_insert ON users;
CREATE POLICY users_insert ON users FOR INSERT
WITH CHECK (
    id = auth.uid()
    OR public.is_super_admin()
    OR public.is_supervisor()
);

-- Self profile edits or management edits over direct reports.
DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users FOR UPDATE
USING (
    id = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_super_admin()
);

-- ──────────────────────── 6. ALERTS RLS ────────────────────────
-- Recipient and sender can read their own alerts; Super Admin sees all.
DROP POLICY IF EXISTS alerts_select ON alerts;
CREATE POLICY alerts_select ON alerts FOR SELECT
USING (
    to_user_id = auth.uid()
    OR from_user_id = auth.uid()
    OR public.is_super_admin()
);

-- The emitting actor is always the sender.
DROP POLICY IF EXISTS alerts_insert ON alerts;
CREATE POLICY alerts_insert ON alerts FOR INSERT
WITH CHECK (from_user_id = auth.uid());

-- Recipient can resolve; management can triage.
DROP POLICY IF EXISTS alerts_update ON alerts;
CREATE POLICY alerts_update ON alerts FOR UPDATE
USING (
    to_user_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_supervisor()
);

-- ──────────────────────── 7. DOCUMENTS RLS ────────────────────────
DROP POLICY IF EXISTS documents_select ON documents;
CREATE POLICY documents_select ON documents FOR SELECT
USING (
    uploader_id = auth.uid()
    OR supervisor_id = auth.uid()
    OR target_user_id = auth.uid()
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS documents_insert ON documents;
CREATE POLICY documents_insert ON documents FOR INSERT
WITH CHECK (
    uploader_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_supervisor()
);

DROP POLICY IF EXISTS documents_update ON documents;
CREATE POLICY documents_update ON documents FOR UPDATE
USING (
    uploader_id = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_super_admin()
);

-- ──────────────────────── 8. LOANS RLS ────────────────────────
DROP POLICY IF EXISTS loans_select ON loans;
CREATE POLICY loans_select ON loans FOR SELECT
USING (
    vsr_id = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS loans_insert ON loans;
CREATE POLICY loans_insert ON loans FOR INSERT
WITH CHECK (
    vsr_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_supervisor()
);

DROP POLICY IF EXISTS loans_update ON loans;
CREATE POLICY loans_update ON loans FOR UPDATE
USING (
    supervisor_id = auth.uid()
    OR public.is_super_admin()
);

-- ──────────────────────── 9. LEAVES RLS ────────────────────────
DROP POLICY IF EXISTS leaves_select ON leaves;
CREATE POLICY leaves_select ON leaves FOR SELECT
USING (
    staff_id = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS leaves_insert ON leaves;
CREATE POLICY leaves_insert ON leaves FOR INSERT
WITH CHECK (
    staff_id = auth.uid()
    OR public.is_super_admin()
    OR public.is_supervisor()
);

DROP POLICY IF EXISTS leaves_update ON leaves;
CREATE POLICY leaves_update ON leaves FOR UPDATE
USING (
    supervisor_id = auth.uid()
    OR public.is_super_admin()
);

-- ──────────────────────── 10. OUTLETS RLS ────────────────────────
DROP POLICY IF EXISTS outlets_select ON outlets;
CREATE POLICY outlets_select ON outlets FOR SELECT
USING (
    merchandiser_id = auth.uid()
    OR supervisor_id = auth.uid()
    OR public.is_super_admin()
);

DROP POLICY IF EXISTS outlets_insert ON outlets;
CREATE POLICY outlets_insert ON outlets FOR INSERT
WITH CHECK (public.is_super_admin() OR public.is_supervisor());

DROP POLICY IF EXISTS outlets_update ON outlets;
CREATE POLICY outlets_update ON outlets FOR UPDATE
USING (public.is_super_admin() OR public.is_supervisor());

COMMIT;
