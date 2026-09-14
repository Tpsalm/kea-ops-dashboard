-- Expand document types used by live VSR and Merchandiser submissions.
-- Production's legacy bootstrap stores documents.type as text, so these
-- values require no enum alteration there. Keep this migration compatible
-- with installations that still have the newer enum.
BEGIN;

DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
		ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'merchandiser_pod';
		ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vsr_weekly_report';
		ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'vsr_monthly_report';
		ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'merchandiser_photo_audit';
	END IF;
END $$;

COMMIT;