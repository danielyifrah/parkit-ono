-- Owner privacy: owners see occupancy on their parkings, not who booked.

-- 1) Owners must not read booker profiles
DROP POLICY IF EXISTS "profiles_select_as_parking_owner" ON public.profiles;

-- 2) Full booking rows (incl. user_id) are only visible to the booker
DROP POLICY IF EXISTS "bookings_select_own_or_owner" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3) Occupancy feed for parking owners — no user_id / payment / review
CREATE OR REPLACE FUNCTION public.get_owner_parking_occupancy()
RETURNS TABLE (
  id TEXT,
  parking_id TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  status TEXT,
  slot_blocked BOOLEAN,
  hold_started_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.parking_id,
    b.date,
    b.start_time,
    b.end_time,
    b.status,
    b.slot_blocked,
    b.hold_started_at,
    b.started_at,
    b.completed_at,
    b.created_at
  FROM public.bookings b
  INNER JOIN public.parkings p ON p.id = b.parking_id
  WHERE p.owner_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_owner_parking_occupancy() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_owner_parking_occupancy() TO authenticated;
