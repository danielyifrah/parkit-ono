-- Admin ops: user suspension, booking refunds, activity log.

-- ─── Profiles: suspension ───────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT NOT NULL DEFAULT '';

-- ─── Bookings: refund marker ──────────────────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS refunded BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- ─── Admin activity log (human-readable) ──────────────
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT 'מנהל',
  action_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  entity_type TEXT,
  entity_label TEXT
);

CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_idx
  ON public.admin_activity_log (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_activity_log_action_type_idx
  ON public.admin_activity_log (action_type);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_activity_select_admin" ON public.admin_activity_log;
CREATE POLICY "admin_activity_select_admin" ON public.admin_activity_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_activity_insert_admin" ON public.admin_activity_log;
CREATE POLICY "admin_activity_insert_admin" ON public.admin_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
