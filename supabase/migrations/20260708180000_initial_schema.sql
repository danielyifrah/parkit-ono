-- Parkit initial schema + demo seed data

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Profiles ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'owner', 'admin')),
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Parkings ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parkings (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'תל אביב',
  price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'private',
  spot_number TEXT NOT NULL DEFAULT '—',
  description TEXT NOT NULL DEFAULT '',
  rating NUMERIC(3, 1) NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  walk_minutes INTEGER NOT NULL DEFAULT 3,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  availability_hours TEXT NOT NULL DEFAULT '',
  availability JSONB NOT NULL DEFAULT '{}'::jsonb,
  bookings_today INTEGER NOT NULL DEFAULT 0,
  income_today NUMERIC(10, 2) NOT NULL DEFAULT 0,
  covered BOOLEAN NOT NULL DEFAULT FALSE,
  photos_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Bookings ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parking_id TEXT NOT NULL REFERENCES public.parkings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  total_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  base_price NUMERIC(10, 2),
  discount_percent NUMERIC(5, 2),
  discount_label TEXT,
  payment_method TEXT NOT NULL DEFAULT 'כרטיס אשראי',
  status TEXT NOT NULL DEFAULT 'scheduled',
  slot_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  hold_started_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review JSONB
);

CREATE INDEX IF NOT EXISTS parkings_owner_id_idx ON public.parkings(owner_id);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_parking_id_idx ON public.bookings(parking_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);

-- ─── Auto profile on signup ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, role, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver'),
    NEW.raw_user_meta_data->>'avatar'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    avatar = EXCLUDED.avatar,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── RLS ────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "parkings_select_all" ON public.parkings;
CREATE POLICY "parkings_select_all" ON public.parkings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "parkings_insert_owner" ON public.parkings;
CREATE POLICY "parkings_insert_owner" ON public.parkings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "parkings_update_owner" ON public.parkings;
CREATE POLICY "parkings_update_owner" ON public.parkings
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "parkings_delete_owner" ON public.parkings;
CREATE POLICY "parkings_delete_owner" ON public.parkings
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "bookings_select_own_or_owner" ON public.bookings;
CREATE POLICY "bookings_select_own_or_owner" ON public.bookings
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.parkings p
      WHERE p.id = bookings.parking_id AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bookings_insert_own" ON public.bookings;
CREATE POLICY "bookings_insert_own" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookings_update_own" ON public.bookings;
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookings_delete_own" ON public.bookings;
CREATE POLICY "bookings_delete_own" ON public.bookings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ─── Demo auth users (password: demo1234) ───────────────
DO $$
DECLARE
  driver_id UUID := 'a1111111-1111-4111-8111-111111111111';
  owner_id UUID := 'a2222222-2222-4222-8222-222222222222';
  admin_id UUID := 'a3333333-3333-4333-8333-333333333333';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'israel@example.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      driver_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'israel@example.com', crypt('demo1234', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"ישראל ישראלי","role":"driver"}'::jsonb, NOW(), NOW()
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      driver_id, driver_id,
      jsonb_build_object('sub', driver_id::text, 'email', 'israel@example.com'),
      'email', driver_id::text, NOW(), NOW(), NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'danny@example.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'danny@example.com', crypt('demo1234', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"דני כהן","role":"owner"}'::jsonb, NOW(), NOW(), NOW()
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      owner_id, owner_id,
      jsonb_build_object('sub', owner_id::text, 'email', 'danny@example.com'),
      'email', owner_id::text, NOW(), NOW(), NOW()
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@parkit.com') THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@parkit.com', crypt('demo1234', gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"מיכל לוי","role":"admin"}'::jsonb, NOW(), NOW()
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      admin_id, admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@parkit.com'),
      'email', admin_id::text, NOW(), NOW(), NOW()
    );
  END IF;
END $$;

INSERT INTO public.profiles (id, email, name, phone, role, avatar)
VALUES
  ('a1111111-1111-4111-8111-111111111111', 'israel@example.com', 'ישראל ישראלי', '050-1234567', 'driver', NULL),
  ('a2222222-2222-4222-8222-222222222222', 'danny@example.com', 'דני כהן', '052-9876543', 'owner', NULL),
  ('a3333333-3333-4333-8333-333333333333', 'admin@parkit.com', 'מיכל לוי', '03-5551234', 'admin', NULL)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;

-- ─── Demo parkings ──────────────────────────────────────
INSERT INTO public.parkings (
  id, owner_id, name, address, city, price_per_hour, type, spot_number, description,
  rating, reviews_count, walk_minutes, available, status, image, images, lat, lng,
  availability_hours, availability, bookings_today, income_today, covered, photos_count
) VALUES
(
  'p1', 'a2222222-2222-4222-8222-222222222222', 'חניה פרטית הרצל', 'רח'' הרצל 45, תל אביב', 'תל אביב', 22, 'private', 'B12',
  'חניה פרטית מקורה בבניין מגורים, כניסה 24/7 עם קוד דלת. מרחק הליכה קצר מרחוב הרצל.',
  4.8, 124, 2, TRUE, 'active',
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  32.0634, 34.7702, '00:00 - 23:59',
  '{"weekly":{"0":{"start":"00:00","end":"23:59"},"1":{"start":"00:00","end":"23:59"},"2":{"start":"00:00","end":"23:59"},"3":{"start":"00:00","end":"23:59"},"4":{"start":"00:00","end":"23:59"},"5":{"start":"00:00","end":"23:59"},"6":{"start":"00:00","end":"23:59"}},"blockedDates":["2026-07-12","2026-07-19"],"bookedSlots":[{"date":"2026-07-08","start":"10:00","end":"14:00"},{"date":"2026-07-15","start":"18:00","end":"21:00"}]}'::jsonb,
  2, 80, TRUE, 8
),
(
  'p2', 'a2222222-2222-4222-8222-222222222222', 'חניה בדיזנגוף סנטר', 'דיזנגוף 50, תל אביב', 'תל אביב', 25, 'public', 'A3',
  'חניה ציבורית בקרבת דיזנגוף סנטר, נגישה ונוחה.',
  4.5, 89, 5, TRUE, 'active',
  'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/280240/pexels-photo-280240.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  32.0773, 34.7745, '07:00 - 22:00',
  '{"weekly":{"0":{"start":"07:00","end":"22:00"},"1":{"start":"07:00","end":"22:00"},"2":{"start":"07:00","end":"22:00"},"3":{"start":"07:00","end":"22:00"},"4":{"start":"07:00","end":"22:00"},"5":{"start":"07:00","end":"22:00"},"6":{"start":"07:00","end":"22:00"}},"blockedDates":["2026-07-06","2026-07-20","2026-07-27"],"bookedSlots":[{"date":"2026-07-10","start":"09:00","end":"13:00"}]}'::jsonb,
  1, 50, FALSE, 4
),
(
  'p3', 'a2222222-2222-4222-8222-222222222222', 'חניה משרדית רוטשילד', 'רח'' רוטשילד 12, תל אביב', 'תל אביב', 18, 'office', 'C7',
  'חניה במשרדים, זמינה בסופי שבוע ובשעות הערב.',
  4.2, 56, 3, TRUE, 'active',
  'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/280232/pexels-photo-280232.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  32.0641, 34.7718, 'א׳-ה׳ 18:00-08:00 · ו׳-ש׳ 00:00-23:59',
  '{"weekly":{"0":{"start":"00:00","end":"23:59"},"1":{"start":"18:00","end":"23:59"},"2":{"start":"18:00","end":"23:59"},"3":{"start":"18:00","end":"23:59"},"4":{"start":"18:00","end":"23:59"},"5":{"start":"18:00","end":"23:59"},"6":{"start":"00:00","end":"23:59"}},"blockedDates":["2026-07-14"],"bookedSlots":[{"date":"2026-07-11","start":"19:00","end":"22:00"}]}'::jsonb,
  0, 0, TRUE, 6
),
(
  'p4', 'a2222222-2222-4222-8222-222222222222', 'חניה פרטית פלורנטין', 'פלורנטין 8, תל אביב', 'תל אביב', 15, 'private', 'D1',
  'חניה פרטית שקטה בשכונת פלורנטין.',
  4.6, 42, 4, TRUE, 'inactive',
  'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  32.0577, 34.7668, '08:00 - 20:00',
  '{"weekly":{"0":{"start":"08:00","end":"20:00"},"1":{"start":"08:00","end":"20:00"},"2":{"start":"08:00","end":"20:00"},"3":{"start":"08:00","end":"20:00"},"4":{"start":"08:00","end":"20:00"},"5":{"start":"08:00","end":"20:00"},"6":{"start":"08:00","end":"20:00"}},"blockedDates":["2026-07-09","2026-07-16"],"bookedSlots":[]}'::jsonb,
  0, 0, FALSE, 3
),
(
  'p5', 'a2222222-2222-4222-8222-222222222222', 'חניה בנמל תל אביב', 'נמל תל אביב, תל אביב', 'תל אביב', 20, 'public', 'E5',
  'חניה ליד נמל תל אביב, מושלמת לבילוי.',
  4.7, 201, 1, TRUE, 'active',
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/323705/pexels-photo-323705.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=800"]'::jsonb,
  32.0972, 34.7755, '00:00 - 23:59',
  '{"weekly":{"0":{"start":"00:00","end":"23:59"},"1":{"start":"00:00","end":"23:59"},"2":{"start":"00:00","end":"23:59"},"3":{"start":"00:00","end":"23:59"},"4":{"start":"00:00","end":"23:59"},"5":{"start":"00:00","end":"23:59"},"6":{"start":"00:00","end":"23:59"}},"blockedDates":["2026-07-18","2026-07-25"],"bookedSlots":[{"date":"2026-07-07","start":"12:00","end":"16:00"},{"date":"2026-07-13","start":"20:00","end":"23:00"}]}'::jsonb,
  3, 120, FALSE, 10
)
ON CONFLICT (id) DO NOTHING;

-- ─── Demo bookings (history) ────────────────────────────
INSERT INTO public.bookings (
  id, user_id, parking_id, date, start_time, end_time, duration_hours, total_price,
  status, payment_method, created_at, review
) VALUES
('b1', 'a1111111-1111-4111-8111-111111111111', 'p1', '2026-06-28', '12:00', '14:30', 2.5, 55, 'completed', 'כרטיס אשראי', '2026-06-28T11:45:00Z', '{"rating":5,"text":"חניה נוחה ונקייה, כניסה קלה."}'::jsonb),
('b2', 'a1111111-1111-4111-8111-111111111111', 'p5', '2026-06-25', '19:00', '22:00', 3, 60, 'completed', 'Apple Pay', '2026-06-25T18:30:00Z', NULL),
('b3', 'a1111111-1111-4111-8111-111111111111', 'p2', '2026-06-20', '10:00', '12:00', 2, 50, 'completed', 'כרטיס אשראי', '2026-06-20T09:50:00Z', '{"rating":4,"text":"מיקום מעולה, קצת צפוף בשעות עומס."}'::jsonb),
('b4', 'a1111111-1111-4111-8111-111111111111', 'p3', '2026-06-15', '18:30', '21:00', 2.5, 45, 'completed', 'Google Pay', '2026-06-15T18:15:00Z', NULL),
('b5', 'a1111111-1111-4111-8111-111111111111', 'p1', '2026-06-10', '09:00', '11:00', 2, 44, 'completed', 'כרטיס אשראי', '2026-06-10T08:40:00Z', NULL),
('b6', 'a1111111-1111-4111-8111-111111111111', 'p4', '2026-05-28', '14:00', '17:00', 3, 45, 'completed', 'Apple Pay', '2026-05-28T13:30:00Z', NULL),
('b7', 'a1111111-1111-4111-8111-111111111111', 'p2', '2026-05-20', '11:30', '13:30', 2, 50, 'completed', 'כרטיס אשראי', '2026-05-20T11:00:00Z', NULL),
('b8', 'a1111111-1111-4111-8111-111111111111', 'p5', '2026-05-12', '16:00', '18:00', 2, 40, 'completed', 'Google Pay', '2026-05-12T15:45:00Z', NULL)
ON CONFLICT (id) DO NOTHING;
