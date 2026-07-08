-- Allow public read of parkings (landing + map) and broader booking reads for demo conflict checks

DROP POLICY IF EXISTS "parkings_select_all" ON public.parkings;
CREATE POLICY "parkings_select_public" ON public.parkings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "bookings_select_own_or_owner" ON public.bookings;
CREATE POLICY "bookings_select_authenticated" ON public.bookings
  FOR SELECT TO authenticated USING (true);
