-- Tighten RLS: own profile, own bookings + owner visibility, active parkings for public

-- Profiles: users can only read their own profile
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Bookings: driver sees own; owner sees bookings on their parkings
DROP POLICY IF EXISTS "bookings_select_authenticated" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_own_or_owner" ON public.bookings;
CREATE POLICY "bookings_select_own_or_owner" ON public.bookings
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.parkings p
      WHERE p.id = bookings.parking_id AND p.owner_id = auth.uid()
    )
  );

-- Parkings: public read for active; owners always see their own (including inactive)
DROP POLICY IF EXISTS "parkings_select_public" ON public.parkings;
DROP POLICY IF EXISTS "parkings_select_all" ON public.parkings;
CREATE POLICY "parkings_select_public" ON public.parkings
  FOR SELECT USING (status = 'active' OR auth.uid() = owner_id);
