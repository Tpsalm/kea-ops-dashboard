-- KEA live tracker schema reconciliation.
-- Additive repair for production databases created from an older bootstrap.

BEGIN;

-- Alerts use these values in the API and dashboard filters.
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'pending_supervisor';
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'pending_admin';
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'resolved';
ALTER TYPE alert_status ADD VALUE IF NOT EXISTS 'rejected';

-- Older production databases may have a reduced loans table. Add the
-- application contract without changing or deleting existing data.
ALTER TABLE loans ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS vsr_id UUID;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS supervisor_id UUID;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS admin_id UUID;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS amount NUMERIC(14,2);
ALTER TABLE loans ADD COLUMN IF NOT EXISTS purpose TEXT;
-- The legacy production bootstrap has no loan_status enum. The API contract
-- treats this field as a string, so use text to remain schema-compatible.
ALTER TABLE loans ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_supervisor';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS supervisor_decision TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS supervisor_notes TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS supervisor_review_date TIMESTAMPTZ;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS admin_decision TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS admin_review_date TIMESTAMPTZ;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursement_date TIMESTAMPTZ;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS repayment_status TEXT DEFAULT 'unpaid';
ALTER TABLE loans ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(14,2) DEFAULT 0;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS application_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE loans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_loans_vsr_status ON loans(vsr_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_supervisor_status ON loans(supervisor_id, status);

COMMIT;