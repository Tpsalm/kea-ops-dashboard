-- =====================================================================
-- KEA System Initialization & Workflow Tracker Schema
-- Target: Supabase PostgreSQL 15+
-- =====================================================================

BEGIN;

-- ──────────────────────── 1. BASE ENUMS ────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'super_admin', 'admin', 'supervisor', 'merchandiser', 'vsr', 'tsr'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE workflow_status AS ENUM (
        'draft', 'submitted_by_vsr', 'submitted_by_merchandiser',
        'under_supervisor_review', 'escalated_to_admin', 'under_admin_review',
        'approved', 'rejected', 'cancelled', 'retracted'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE workflow_step_type AS ENUM (
        'create', 'draft_edit', 'submit', 'review', 'escalate',
        'admin_action_approve', 'admin_action_reject', 'admin_action_create',
        'message', 'retract', 'auto_assign_supervisor', 'auto_escalate',
        'doc_attach', 'loan_attach'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE message_direction AS ENUM (
        'upstream', 'downstream', 'broadcast_within_scope'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ──────────────────────── 2. PREREQUISITE TABLES ────────────────────────

-- Create users table if missing
CREATE TABLE IF NOT EXISTS users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role       user_role NOT NULL DEFAULT 'merchandiser',
    tsr_id     UUID REFERENCES users(id), -- Self-reference tracking
    email      TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create clients table if missing
CREATE TABLE IF NOT EXISTS clients (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit_logs table if missing
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES users(id),
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    old_data    JSONB,
    new_data    JSONB,
    ip_address  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ──────────────────────── 3. WORKFLOW TABLES ────────────────────────

CREATE TABLE IF NOT EXISTS workflows (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    related_entity_type      TEXT,
    related_entity_id        UUID,
    originator_id            UUID NOT NULL REFERENCES users(id),
    originator_role          user_role NOT NULL,
    assigned_supervisor_id   UUID NOT NULL REFERENCES users(id),
    assigned_admin_id        UUID REFERENCES users(id),
    client_id                UUID REFERENCES clients(id),
    status                   workflow_status NOT NULL DEFAULT 'draft',
    title                    TEXT NOT NULL,
    summary                  TEXT,
    priority                 SMALLINT NOT NULL DEFAULT 1,
    document_ids             JSONB NOT NULL DEFAULT '[]'::jsonb,
    step_version             SMALLINT NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_workflow_entity_active
    ON workflows (related_entity_type, related_entity_id)
    WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_workflows_supervisor_status ON workflows (assigned_supervisor_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_originator_time ON workflows (originator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_admin_status ON workflows (assigned_admin_id, status);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id  UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    step_order   SMALLINT NOT NULL,
    step_type    workflow_step_type NOT NULL,
    actor_id     UUID NOT NULL REFERENCES users(id),
    actor_role   user_role NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT,
    status_from  workflow_status,
    status_to    workflow_status,
    metadata     JSONB,
    occurred_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uniq_workflow_step_order UNIQUE (workflow_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_time ON workflow_steps (workflow_id, occurred_at);

CREATE TABLE IF NOT EXISTS workflow_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    target_user_id  UUID NOT NULL REFERENCES users(id),
    direction       message_direction NOT NULL,
    body            TEXT NOT NULL,
    attachment_url  TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wfmsg_workflow_sent ON workflow_messages (workflow_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_wfmsg_target_read ON workflow_messages (target_user_id, is_read);


-- ──────────────────────── 4. AUDIT TRIGGER ────────────────────────
CREATE OR REPLACE FUNCTION trg_workflow_step_to_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        id, actor_id, action, entity_type, entity_id,
        old_data, new_data, ip_address, created_at
    ) VALUES (
        gen_random_uuid(),
        NEW.actor_id,
        'INSERT',
        'workflow_step',
        NEW.id,
        NULL::jsonb,
        to_jsonb(NEW),
        current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
        now()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_workflow_step_audit_insert ON workflow_steps;
CREATE TRIGGER trg_workflow_step_audit_insert
AFTER INSERT ON workflow_steps
FOR EACH ROW EXECUTE FUNCTION trg_workflow_step_to_audit();


-- ──────────────────────── 5. ROW LEVEL SECURITY ────────────────────────
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_messages ENABLE ROW LEVEL SECURITY;

-- workflows: SELECT
DROP POLICY IF EXISTS workflows_select ON workflows;
CREATE POLICY workflows_select ON workflows FOR SELECT
USING (
    auth.uid() = originator_id
    OR auth.uid() = assigned_supervisor_id
    OR auth.uid() = assigned_admin_id
    OR EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = assigned_supervisor_id
          AND u.tsr_id = auth.uid()
    )
);

-- workflows: INSERT
DROP POLICY IF EXISTS workflows_insert ON workflows;
CREATE POLICY workflows_insert ON workflows FOR INSERT
WITH CHECK (
    auth.uid() = originator_id
    OR (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin','admin','supervisor'))
    )
);

-- workflows: UPDATE
DROP POLICY IF EXISTS workflows_update ON workflows;
CREATE POLICY workflows_update ON workflows FOR UPDATE
USING (
    auth.uid() = assigned_supervisor_id
    OR auth.uid() = assigned_admin_id
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin','admin'))
);

-- workflow_steps: SELECT
DROP POLICY IF EXISTS workflow_steps_select ON workflow_steps;
CREATE POLICY workflow_steps_select ON workflow_steps FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM workflows w
        WHERE w.id = workflow_steps.workflow_id
          AND (
              w.originator_id = auth.uid()
              OR w.assigned_supervisor_id = auth.uid()
              OR w.assigned_admin_id = auth.uid()
              OR EXISTS (
                  SELECT 1 FROM users u
                  WHERE u.id = w.assigned_supervisor_id
                    AND u.tsr_id = auth.uid()
              )
          )
    )
);

-- workflow_steps: INSERT
DROP POLICY IF EXISTS workflow_steps_insert ON workflow_steps;
CREATE POLICY workflow_steps_insert ON workflow_steps FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- workflow_messages: SELECT
DROP POLICY IF EXISTS workflow_messages_select ON workflow_messages;
CREATE POLICY workflow_messages_select ON workflow_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = target_user_id);

-- workflow_messages: INSERT
DROP POLICY IF EXISTS workflow_messages_insert ON workflow_messages;
CREATE POLICY workflow_messages_insert ON workflow_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

COMMIT;
