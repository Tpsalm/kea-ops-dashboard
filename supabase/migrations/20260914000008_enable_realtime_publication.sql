-- Enable Supabase Realtime for the live dashboard sync pipeline.
-- Without these tables in the `supabase_realtime` publication, the
-- postgres_changes subscriptions in the dashboards receive nothing and the
-- app silently falls back to 12s polling + instant broadcast messages.
--
-- Keep broadcasts working: documents is broadcast directly from POST
-- /api/documents, so dashboards update instantly even before this runs.
--
-- Safe to run repeatedly — each ALTER is guarded and idempotent.

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workflows;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_steps;
  EXCEPTION WHEN duplicate_object THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;