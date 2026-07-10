-- Admin foundation: helper + broad RLS. Admin is never created via signup (see lock_roles).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Admins may change roles; other authenticated users may not
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Changing role is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

-- ─── Profiles ───────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Parkings ───────────────────────────────────────────
DROP POLICY IF EXISTS "parkings_select_admin" ON public.parkings;
CREATE POLICY "parkings_select_admin" ON public.parkings
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "parkings_insert_admin" ON public.parkings;
CREATE POLICY "parkings_insert_admin" ON public.parkings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "parkings_update_admin" ON public.parkings;
CREATE POLICY "parkings_update_admin" ON public.parkings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "parkings_delete_admin" ON public.parkings;
CREATE POLICY "parkings_delete_admin" ON public.parkings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── Bookings ───────────────────────────────────────────
DROP POLICY IF EXISTS "bookings_select_admin" ON public.bookings;
CREATE POLICY "bookings_select_admin" ON public.bookings
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "bookings_insert_admin" ON public.bookings;
CREATE POLICY "bookings_insert_admin" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bookings_update_admin" ON public.bookings;
CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bookings_delete_admin" ON public.bookings;
CREATE POLICY "bookings_delete_admin" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ─── Payment methods ────────────────────────────────────
DROP POLICY IF EXISTS "payment_methods_select_admin" ON public.payment_methods;
CREATE POLICY "payment_methods_select_admin" ON public.payment_methods
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "payment_methods_insert_admin" ON public.payment_methods;
CREATE POLICY "payment_methods_insert_admin" ON public.payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payment_methods_update_admin" ON public.payment_methods;
CREATE POLICY "payment_methods_update_admin" ON public.payment_methods
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payment_methods_delete_admin" ON public.payment_methods;
CREATE POLICY "payment_methods_delete_admin" ON public.payment_methods
  FOR DELETE TO authenticated
  USING (public.is_admin());
