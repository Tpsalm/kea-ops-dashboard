-- =============================================================
-- KEA Field Operations Dashboard — Supabase Production DDL
-- Dialect: PostgreSQL 15+ / Supabase
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. ENUMS & CUSTOM TYPES
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'supervisor',
    'vsr',
    'merchandiser',
    'tsr'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'on_leave'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE loan_status AS ENUM (
    'draft',
    'pending_supervisor',
    'pending_admin',
    'approved',
    'rejected',
    'disbursed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM (
    'funding_request',
    'leave_request',
    'document_upload',
    'performance_review',
    'system_event',
    'pod_submission',
    'field_report_submission',
    'alert_resolution'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM (
    'info',
    'warning',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM (
    'pending_supervisor',
    'pending_admin',
    'resolved',
    'rejected',
    'pending',
    'reviewed',
    'escalated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM (
    'pod_tracker',
    'performance_report'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_status AS ENUM (
    'pending_review',
    'reviewed',
    'escalated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE outlet_type AS ENUM (
    'supermarket',
    'convenience',
    'wholesale',
    'pharmacy',
    'horeca',
    'kiosk'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE outlet_tier AS ENUM (
    'platinum',
    'gold',
    'silver',
    'bronze'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE outlet_status AS ENUM (
    'healthy',
    'needs_review',
    'inactive'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. CLIENTS (Multi-Tenant Root)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  sector      TEXT,
  code        VARCHAR(50) UNIQUE,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─────────────────────────────────────────────────────────────
-- 3. USERS & HIERARCHICAL PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id        UUID UNIQUE,
  client_id      UUID REFERENCES clients(id) ON DELETE CASCADE,
  supervisor_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  tsr_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  email          VARCHAR(255) UNIQUE NOT NULL,
  name           VARCHAR(255) NOT NULL,
  role           user_role NOT NULL,
  status         user_status NOT NULL DEFAULT 'active',
  phone          VARCHAR(30),
  region         VARCHAR(100),
  state          VARCHAR(100),
  lga            VARCHAR(100),
  territory      VARCHAR(100),
  loan_debt      NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (loan_debt >= 0),
  meta           JSONB DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT chk_no_self_supervision CHECK (id <> supervisor_id)
);

-- ─────────────────────────────────────────────────────────────
-- 4. OUTLETS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outlets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,
  supervisor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  merchandiser_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  address         TEXT,
  region          VARCHAR(100),
  state           VARCHAR(100),
  lga             VARCHAR(100),
  territory       VARCHAR(100),
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  type            outlet_type NOT NULL DEFAULT 'wholesale',
  tier            outlet_tier NOT NULL DEFAULT 'silver',
  status          outlet_status NOT NULL DEFAULT 'healthy',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─────────────────────────────────────────────────────────────
-- 5. VSR LOANS & FUNDING APPLICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               UUID REFERENCES clients(id) ON DELETE CASCADE,
  vsr_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_id                UUID REFERENCES users(id) ON DELETE SET NULL,
  amount                  NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  purpose                 TEXT NOT NULL,
  status                  loan_status NOT NULL DEFAULT 'pending_supervisor',
  
  -- Supervisor review stage
  supervisor_decision     VARCHAR(20) CHECK (supervisor_decision IN ('approved', 'rejected', 'pending')),
  supervisor_notes        TEXT,
  supervisor_review_date  TIMESTAMPTZ,
  
  -- Super Admin review stage
  admin_decision          VARCHAR(20) CHECK (admin_decision IN ('approved', 'rejected', 'pending')),
  admin_notes             TEXT,
  admin_review_date       TIMESTAMPTZ,
  
  -- Financial reconciliation
  disbursement_date       TIMESTAMPTZ,
  outstanding_balance     NUMERIC(14,2) NOT NULL DEFAULT 0.00 CHECK (outstanding_balance >= 0),
  repayment_status        VARCHAR(50) DEFAULT 'unpaid' CHECK (repayment_status IN ('unpaid', 'partial', 'settled', 'none')),
  application_date        TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─────────────────────────────────────────────────────────────
-- 6. LEAVES (Merchandiser Schedule Management)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaves (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES clients(id) ON DELETE CASCADE,
  staff_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  reason        TEXT NOT NULL,
  status        leave_status NOT NULL DEFAULT 'approved',
  approved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT chk_valid_leave_dates CHECK (end_date >= start_date)
);

-- ─────────────────────────────────────────────────────────────
-- 7. DOCUMENT VAULT (POD Tracker & Performance Reports)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID REFERENCES clients(id) ON DELETE CASCADE,
  uploader_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  supervisor_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type           document_type NOT NULL,
  title          VARCHAR(255) NOT NULL,
  file_url       TEXT NOT NULL,
  file_name      VARCHAR(255),
  file_size      BIGINT,
  mime_type      VARCHAR(100),
  status         document_status NOT NULL DEFAULT 'pending_review',
  notes          TEXT,
  uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─────────────────────────────────────────────────────────────
-- 8. ALERTS & HIERARCHICAL ESCALATION ENGINE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES clients(id) ON DELETE CASCADE,
  type                alert_type NOT NULL,
  severity            alert_severity NOT NULL DEFAULT 'info',
  title               VARCHAR(255) NOT NULL,
  message             TEXT NOT NULL,
  from_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  status              alert_status NOT NULL DEFAULT 'pending_supervisor',
  related_entity_type VARCHAR(50) NOT NULL,
  related_entity_id   UUID,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at         TIMESTAMPTZ,
  resolved_at         TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- 9. AUDIT TRAIL
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ─────────────────────────────────────────────────────────────
-- 10. INDEXES FOR HIGH-THROUGHPUT RETRIEVAL
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_role_status        ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_supervisor         ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_client             ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_debt               ON users(loan_debt);
CREATE INDEX IF NOT EXISTS idx_outlets_supervisor       ON outlets(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_outlets_merchandiser     ON outlets(merchandiser_id);
CREATE INDEX IF NOT EXISTS idx_loans_vsr_status         ON loans(vsr_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_supervisor_status  ON loans(supervisor_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_hierarchy         ON alerts(to_user_id, status, supervisor_id);
CREATE INDEX IF NOT EXISTS idx_alerts_related_entity    ON alerts(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_leaves_staff_date        ON leaves(staff_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_documents_type_uploaded  ON documents(type, uploaded_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 11. DATABASE TRIGGERS & VALIDATION ENGINES
-- ─────────────────────────────────────────────────────────────

-- Trigger 1: Strict VSR Funding Validation Gate
CREATE OR REPLACE FUNCTION fn_validate_vsr_funding_eligibility()
RETURNS TRIGGER AS $$
DECLARE
  v_current_debt NUMERIC(14,2);
  v_role user_role;
  v_sup_id UUID;
BEGIN
  SELECT loan_debt, role, supervisor_id INTO v_current_debt, v_role, v_sup_id
  FROM users
  WHERE id = NEW.vsr_id;

  IF v_role <> 'vsr' THEN
    RAISE EXCEPTION 'Only users with role VSR can apply for business funding.';
  END IF;

  IF v_current_debt > 0 THEN
    RAISE EXCEPTION 'Ineligible due to active loan debt. Current debt: %', v_current_debt;
  END IF;

  -- Auto-assign supervisor from VSR profile if not explicitly passed
  IF NEW.supervisor_id IS NULL AND v_sup_id IS NOT NULL THEN
    NEW.supervisor_id := v_sup_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_vsr_funding ON loans;
CREATE TRIGGER trg_validate_vsr_funding
  BEFORE INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_vsr_funding_eligibility();

-- Trigger 2: Automatic Hierarchy Alert Generation on Document Vault Upload
CREATE OR REPLACE FUNCTION fn_on_document_vault_upload()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_id UUID;
  v_uploader_name TEXT;
BEGIN
  SELECT name INTO v_uploader_name FROM users WHERE id = NEW.uploader_id;

  -- Pick super admin for the client or global
  SELECT id INTO v_super_admin_id 
  FROM users 
  WHERE role = 'super_admin' AND (client_id = NEW.client_id OR NEW.client_id IS NULL)
  LIMIT 1;

  IF v_super_admin_id IS NOT NULL THEN
    INSERT INTO alerts (
      client_id,
      type,
      severity,
      title,
      message,
      from_user_id,
      to_user_id,
      supervisor_id,
      status,
      related_entity_type,
      related_entity_id
    ) VALUES (
      NEW.client_id,
      'document_upload',
      'info',
      'Document Uploaded: ' || NEW.title,
      COALESCE(v_uploader_name, 'Supervisor') || ' uploaded ' || NEW.type::text || ' for review.',
      NEW.uploader_id,
      v_super_admin_id,
      NEW.uploader_id,
      'pending_admin',
      'documents',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_vault_alert ON documents;
CREATE TRIGGER trg_document_vault_alert
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION fn_on_document_vault_upload();

-- ─────────────────────────────────────────────────────────────
-- 12. ROW-LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 13. SEED DATA
-- ─────────────────────────────────────────────────────────────
-- Clients
INSERT INTO clients (id, name, sector, code) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nova Consumer', 'Consumer goods', 'NOVA-001'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Aria Foods', 'Food & beverage', 'ARIA-002')
ON CONFLICT (id) DO NOTHING;

-- Super Admin
INSERT INTO users (id, email, name, role, status, loan_debt, client_id) VALUES
  ('99a1b2c3-d4e5-6789-0abc-def123456789', 'admin@kea.com', 'Executive Super Admin', 'super_admin', 'active', 0, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- Supervisors
INSERT INTO users (id, email, name, role, status, region, state, lga, territory, client_id) VALUES
  ('c1d2e3f4-a5b6-7890-cdef-123456789001', 'oluchukwu.onyeike@kea.com', 'Oluchukwu Onyeike', 'supervisor', 'active', 'Lagos', 'Lagos', 'Lagos Mainland', 'Lagos Central', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('c2d3e4f5-b6c7-8901-defa-234567890102', 'moses.akindiran@kea.com', 'Moses Akindiran', 'supervisor', 'active', 'Lagos', 'Lagos', 'Eti-Osa', 'Lagos East', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('c3d4e5f6-c7d8-9012-efab-345678901203', 'michael.olayiwola@kea.com', 'Michael Olayiwola', 'supervisor', 'active', 'Ogun', 'Ogun', 'Ijebu Ode', 'Ijebu', 'b2c3d4e5-f6a7-8901-bcde-f12345678901')
ON CONFLICT (id) DO NOTHING;

-- Merchandisers
INSERT INTO users (id, email, name, role, status, region, state, lga, territory, supervisor_id, client_id) VALUES
  ('d1e2f3a4-b5c6-7890-fabc-456789012301', 'maria.uchechukwu@kea.com', 'Maria Uchechukwu', 'merchandiser', 'active', 'Lagos', 'Lagos', 'Eti-Osa', 'Lagos Island', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('d2e3f4a5-c6d7-8901-abcd-567890123402', 'abiola.omowuni@kea.com', 'Abiola Felicia Omowuni', 'merchandiser', 'active', 'Lagos', 'Lagos', 'Lagos Island', 'Lagos Island', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('d3e4f5a6-d7e8-9012-bcde-678901234503', 'ologbonori.toyosi@kea.com', 'Ologbonori Toyosi', 'merchandiser', 'on_leave', 'Ogun', 'Ogun', 'Ijebu Ode', 'Ijebu', 'c3d4e5f6-c7d8-9012-efab-345678901203', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('d4e5f6a7-e8f9-0123-cdef-789012345604', 'jonathan.okena@kea.com', 'Jonathan Okena', 'merchandiser', 'active', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('d5e6f7a8-f9a0-1234-defa-890123456705', 'arorundade.adewale@kea.com', 'Arorundade Adewale', 'merchandiser', 'inactive', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- VSRs (e1 has active loan debt; e2, e3 are debt-free)
INSERT INTO users (id, email, name, role, status, region, state, lga, territory, supervisor_id, client_id, loan_debt) VALUES
  ('e1f2a3b4-c5d6-7890-efab-901234567801', 'shittu.akinsanya@kea.com', 'Shittu Akinsanya', 'vsr', 'active', 'Lagos', 'Lagos', 'Ikeja', 'Lagos Central', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 180000.00),
  ('e2f3a4b5-d6e7-8901-fabc-012345678902', 'abel.nduka@kea.com', 'Abel Nduka', 'vsr', 'active', 'Lagos', 'Lagos', 'Surulere', 'Lagos West', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 0.00),
  ('e3f4a5b6-e7f8-9012-abcd-123456789003', 'paul.olakonipekun@kea.com', 'Paul Olakonipekun', 'vsr', 'active', 'Ogun', 'Ogun', 'Abeokuta North', 'Abeokuta', 'c3d4e5f6-c7d8-9012-efab-345678901203', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0.00)
ON CONFLICT (id) DO NOTHING;

-- Outlets
INSERT INTO outlets (id, name, address, region, state, lga, territory, lat, lng, type, tier, status, merchandiser_id, supervisor_id, client_id) VALUES
  ('f1a2b3c4-d5e6-7890-abcd-ef0123456701', 'Ikeja North Hub', '15 Obafemi Awolowo Way, Ikeja', 'Lagos', 'Lagos', 'Ikeja', 'Lagos Central', 6.6018, 3.3515, 'wholesale', 'gold', 'healthy', 'd1e2f3a4-b5c6-7890-fabc-456789012301', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('f2a3b4c5-e6f7-8901-bcde-f01234567802', 'Surulere A2 Retail', '42 Bode Thomas Street, Surulere', 'Lagos', 'Lagos', 'Surulere', 'Lagos West', 6.4969, 3.3532, 'convenience', 'silver', 'healthy', 'd2e3f4a5-c6d7-8901-abcd-567890123402', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('f3a4b5c6-f7a8-9012-cdef-012345678903', 'Abeokuta North Market', '8 Lafenwa Road, Abeokuta', 'Ogun', 'Ogun', 'Abeokuta North', 'Abeokuta', 7.1475, 3.3619, 'wholesale', 'bronze', 'needs_review', 'd3e4f5a6-d7e8-9012-bcde-678901234503', 'c3d4e5f6-c7d8-9012-efab-345678901203', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('f4a5b6c7-a8b9-0123-defa-123456789004', 'Ring Road Superstore', '23 Ring Road, Ibadan', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 7.3776, 3.947, 'supermarket', 'platinum', 'healthy', 'd4e5f6a7-e8f9-0123-cdef-789012345604', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('f5a6b7c8-b9c0-1234-efab-234567890105', 'Dugbe Retail Center', '11 Dugbe Market Road, Ibadan', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 7.3866, 3.956, 'convenience', 'gold', 'healthy', 'd5e6f7a8-f9a0-1234-defa-890123456705', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- Initial Seed Loans
INSERT INTO loans (id, vsr_id, supervisor_id, amount, purpose, status, outstanding_balance, repayment_status) VALUES
  ('01a2b3c4-d5e6-7890-abcd-ef0123456701', 'e1f2a3b4-c5d6-7890-efab-901234567801', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 250000.00, 'Q2 Working Capital', 'disbursed', 180000.00, 'partial'),
  ('02a3b4c5-e6f7-8901-bcde-f01234567802', 'e3f4a5b6-e7f8-9012-abcd-123456789003', 'c3d4e5f6-c7d8-9012-efab-345678901203', 150000.00, 'Abeokuta Route Expansion', 'pending_supervisor', 0.00, 'none')
ON CONFLICT (id) DO NOTHING;
