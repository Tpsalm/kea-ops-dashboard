-- =============================================================
-- KEA Field Operations Dashboard — Supabase DDL
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- ENUM types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin','supervisor','vsr','merchandiser','tsr');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active','inactive','on_leave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE loan_status AS ENUM ('pending_supervisor','pending_admin','approved','rejected','disbursed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE leave_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('funding_request','leave_request','document_upload','performance_review','system_event');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('info','warning','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('pending','reviewed','escalated','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('pod_tracker','performance_report');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending_review','reviewed','escalated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE outlet_type AS ENUM ('supermarket','convenience','wholesale','pharmacy','horeca','kiosk');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE outlet_tier AS ENUM ('platinum','gold','silver','bronze');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE outlet_status AS ENUM ('healthy','needs_review','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Clients
CREATE TABLE IF NOT EXISTS clients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  sector     TEXT,
  status     TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  role           user_role NOT NULL,
  status         user_status DEFAULT 'active',
  phone          TEXT,
  region         TEXT,
  state          TEXT,
  lga            TEXT,
  territory      TEXT,
  supervisor_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  tsr_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  loan_debt      NUMERIC(12,2) DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 3. Outlets
CREATE TABLE IF NOT EXISTS outlets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT,
  region          TEXT,
  state           TEXT,
  lga             TEXT,
  territory       TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  type            outlet_type,
  tier            outlet_tier,
  status          outlet_status DEFAULT 'healthy',
  merchandiser_id UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Loans / Funding
CREATE TABLE IF NOT EXISTS loans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vsr_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount                  NUMERIC(12,2) NOT NULL,
  purpose                 TEXT,
  status                  loan_status DEFAULT 'pending_supervisor',
  application_date        TIMESTAMPTZ DEFAULT now(),
  supervisor_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_review_date  TIMESTAMPTZ,
  supervisor_notes        TEXT,
  admin_id                UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_review_date       TIMESTAMPTZ,
  admin_notes             TEXT,
  disbursement_date       TIMESTAMPTZ,
  repayment_status        TEXT DEFAULT 'none',
  outstanding_balance     NUMERIC(12,2) DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- 5. Leaves
CREATE TABLE IF NOT EXISTS leaves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT,
  status      leave_status DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 6. Alerts (Hierarchical Alert Chain)
CREATE TABLE IF NOT EXISTS alerts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type               alert_type NOT NULL,
  severity           alert_severity DEFAULT 'info',
  title              TEXT NOT NULL,
  message            TEXT,
  from_user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  status             alert_status DEFAULT 'pending',
  related_entity_type TEXT,
  related_entity_id  UUID,
  created_at         TIMESTAMPTZ DEFAULT now(),
  reviewed_at        TIMESTAMPTZ,
  resolved_at        TIMESTAMPTZ
);

-- 7. Documents
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type          document_type NOT NULL,
  title         TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     TEXT,
  status        document_status DEFAULT 'pending_review',
  notes         TEXT,
  uploaded_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_supervisor   ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_client       ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_region       ON users(region);
CREATE INDEX IF NOT EXISTS idx_outlets_client     ON outlets(client_id);
CREATE INDEX IF NOT EXISTS idx_outlets_supervisor ON outlets(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_loans_vsr          ON loans(vsr_id);
CREATE INDEX IF NOT EXISTS idx_loans_status       ON loans(status);
CREATE INDEX IF NOT EXISTS idx_alerts_to          ON alerts(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_supervisor  ON alerts(supervisor_id, status);
CREATE INDEX IF NOT EXISTS idx_leaves_staff       ON leaves(staff_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploader_id);

-- =============================================================
-- SEED DATA — Run AFTER the tables above are created
-- =============================================================

-- Clients
INSERT INTO clients (id, name, sector) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nova Consumer', 'Consumer goods'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Aria Foods', 'Food & beverage')
ON CONFLICT (id) DO NOTHING;

-- Supervisors
INSERT INTO users (id, email, name, role, region, state, lga, territory, client_id) VALUES
  ('c1d2e3f4-a5b6-7890-cdef-123456789001', 'oluchukwu.onyeike@kea.com', 'Oluchukwu Onyeike', 'supervisor', 'Lagos', 'Lagos', 'Lagos Mainland', 'Lagos Central', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('c2d3e4f5-b6c7-8901-defa-234567890102', 'moses.akindiran@kea.com', 'Moses Akindiran', 'supervisor', 'Lagos', 'Lagos', 'Eti-Osa', 'Lagos East', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('c3d4e5f6-c7d8-9012-efab-345678901203', 'michael.olayiwola@kea.com', 'Michael Olayiwola', 'supervisor', 'Ogun', 'Ogun', 'Ijebu Ode', 'Ijebu', 'b2c3d4e5-f6a7-8901-bcde-f12345678901')
ON CONFLICT (id) DO NOTHING;

-- Merchandisers
INSERT INTO users (id, email, name, role, region, state, lga, territory, supervisor_id, client_id) VALUES
  ('d1e2f3a4-b5c6-7890-fabc-456789012301', 'maria.uchechukwu@kea.com', 'Maria Uchechukwu', 'merchandiser', 'Lagos', 'Lagos', 'Eti-Osa', 'Lagos Island', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('d2e3f4a5-c6d7-8901-abcd-567890123402', 'abiola.omowuni@kea.com', 'Abiola Felicia Omowuni', 'merchandiser', 'Lagos', 'Lagos', 'Lagos Island', 'Lagos Island', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('d3e4f5a6-d7e8-9012-bcde-678901234503', 'ologbonori.toyosi@kea.com', 'Ologbonori Toyosi', 'merchandiser', 'Ogun', 'Ogun', 'Ijebu Ode', 'Ijebu', 'c3d4e5f6-c7d8-9012-efab-345678901203', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('d4e5f6a7-e8f9-0123-cdef-789012345604', 'jonathan.okena@kea.com', 'Jonathan Okena', 'merchandiser', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('d5e6f7a8-f9a0-1234-defa-890123456705', 'arorundade.adewale@kea.com', 'Arorundade Adewale', 'merchandiser', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- VSRs
INSERT INTO users (id, email, name, role, region, state, lga, territory, supervisor_id, client_id) VALUES
  ('e1f2a3b4-c5d6-7890-efab-901234567801', 'shittu.akinsanya@kea.com', 'Shittu Akinsanya', 'vsr', 'Lagos', 'Lagos', 'Ikeja', 'Lagos Central', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('e2f3a4b5-d6e7-8901-fabc-012345678902', 'abel.nduka@kea.com', 'Abel Nduka', 'vsr', 'Lagos', 'Lagos', 'Surulere', 'Lagos West', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('e3f4a5b6-e7f8-9012-abcd-123456789003', 'paul.olakonipekun@kea.com', 'Paul Olakonipekun', 'vsr', 'Ogun', 'Ogun', 'Abeokuta North', 'Abeokuta', 'c3d4e5f6-c7d8-9012-efab-345678901203', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('e4f5a6b7-f8a9-0123-bcde-234567890104', 'timothy.ogunmokun@kea.com', 'Timothy Ogunmokun', 'vsr', 'Ogun', 'Ogun', 'Abeokuta South', 'Abeokuta', 'c3d4e5f6-c7d8-9012-efab-345678901203', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('e5f6a7b8-a9b0-1234-cdef-345678901205', 'ikechukwu.maduora@kea.com', 'Ikechukwu Maduora', 'vsr', 'Delta', 'Delta', 'Oshimili South', 'Asaba', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'b2c3d4e5-f6a7-8901-bcde-f12345678901')
ON CONFLICT (id) DO NOTHING;

-- Outlets
INSERT INTO outlets (id, name, address, region, state, lga, territory, lat, lng, type, tier, status, merchandiser_id, supervisor_id, client_id) VALUES
  ('f1a2b3c4-d5e6-7890-abcd-ef0123456701', 'Ikeja North Hub', '15 Obafemi Awolowo Way, Ikeja', 'Lagos', 'Lagos', 'Ikeja', 'Lagos Central', 6.6018, 3.3515, 'wholesale', 'gold', 'healthy', 'd1e2f3a4-b5c6-7890-fabc-456789012301', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('f2a3b4c5-e6f7-8901-bcde-f01234567802', 'Surulere A2 Retail', '42 Bode Thomas Street, Surulere', 'Lagos', 'Lagos', 'Surulere', 'Lagos West', 6.4969, 3.3532, 'retail', 'silver', 'healthy', 'd2e3f4a5-c6d7-8901-abcd-567890123402', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('f3a4b5c6-f7a8-9012-cdef-012345678903', 'Abeokuta North Market', '8 Lafenwa Road, Abeokuta', 'Ogun', 'Ogun', 'Abeokuta North', 'Abeokuta', 7.1475, 3.3619, 'wholesale', 'bronze', 'needs_review', 'd3e4f5a6-d7e8-9012-bcde-678901234503', 'c3d4e5f6-c7d8-9012-efab-345678901203', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
  ('f4a5b6c7-a8b9-0123-defa-123456789004', 'Ring Road Superstore', '23 Ring Road, Ibadan', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 7.3776, 3.947, 'supermarket', 'platinum', 'healthy', 'd4e5f6a7-e8f9-0123-cdef-789012345604', 'c1d2e3f4-a5b6-7890-cdef-123456789001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  ('f5a6b7c8-b9c0-1234-efab-234567890105', 'Dugbe Retail Center', '11 Dugbe Market Road, Ibadan', 'Oyo', 'Oyo', 'Ibadan North', 'Ibadan', 7.3866, 3.956, 'convenience', 'gold', 'healthy', 'd5e6f7a8-f9a0-1234-defa-890123456705', 'c2d3e4f5-b6c7-8901-defa-234567890102', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- Sample loans (for testing the validation engine)
INSERT INTO loans (id, vsr_id, amount, status, outstanding_balance) VALUES
  ('01a2b3c4-d5e6-7890-abcd-ef0123456701', 'e1f2a3b4-c5d6-7890-efab-901234567801', 250000.00, 'disbursed', 180000.00),
  ('02a3b4c5-e6f7-8901-bcde-f01234567802', 'e3f4a5b6-e7f8-9012-abcd-123456789003', 150000.00, 'pending_supervisor', 0)
ON CONFLICT (id) DO NOTHING;

-- Update VSR loan debts to match
UPDATE users SET loan_debt = 180000.00 WHERE id = 'e1f2a3b4-c5d6-7890-efab-901234567801';
