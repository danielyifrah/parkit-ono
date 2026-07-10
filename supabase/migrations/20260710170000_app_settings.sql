-- App-wide settings (maintenance / bookings freeze) + revoke admin card access.

-- ─── App settings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global' CHECK (id = 'global'),
  bookings_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL DEFAULT 'האפליקציה מושבתת זמנית לתחזוקה. ניתן להתחבר, אך לא ניתן לבצע הזמנות או לנהל חניות כרגע.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.app_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read (banner + client guards)
DROP POLICY IF EXISTS "app_settings_select_authenticated" ON public.app_settings;
CREATE POLICY "app_settings_select_authenticated" ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can update
DROP POLICY IF EXISTS "app_settings_update_admin" ON public.app_settings;
CREATE POLICY "app_settings_update_admin" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── No admin access to payment methods (credit / bank details) ───
DROP POLICY IF EXISTS "payment_methods_select_admin" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_insert_admin" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_update_admin" ON public.payment_methods;
DROP POLICY IF EXISTS "payment_methods_delete_admin" ON public.payment_methods;
