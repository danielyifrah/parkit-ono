-- Allow parking owners to read profiles of users who booked their parkings
-- (needed for the owner weekly schedule: who reserved the spot)

DROP POLICY IF EXISTS "profiles_select_as_parking_owner" ON public.profiles;
CREATE POLICY "profiles_select_as_parking_owner" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.parkings p ON p.id = b.parking_id
      WHERE b.user_id = profiles.id
        AND p.owner_id = auth.uid()
    )
  );
