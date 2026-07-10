-- Lock roles: no self-escalation; signup cannot create admin; only owners/admins add parkings.

-- 1) Signup: only driver | owner from metadata (never admin). Do not overwrite role on conflict.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_role TEXT;
BEGIN
  signup_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' = 'owner' THEN 'owner'
    ELSE 'driver'
  END;

  INSERT INTO public.profiles (id, email, name, phone, role, avatar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    signup_role,
    NEW.raw_user_meta_data->>'avatar'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    avatar = EXCLUDED.avatar,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2) Authenticated users cannot change profiles.role (service/SQL with no auth.uid still can)
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Changing role is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_role_immutable ON public.profiles;
CREATE TRIGGER profiles_role_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_change();

-- 3) Users can update their own profile row (role changes blocked by trigger above)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4) Only owner/admin can insert parkings (still must be owner_id = self)
DROP POLICY IF EXISTS "parkings_insert_owner" ON public.parkings;
CREATE POLICY "parkings_insert_owner" ON public.parkings
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
    )
  );

-- Keep update/delete tied to ownership, and require an owner/admin role
DROP POLICY IF EXISTS "parkings_update_owner" ON public.parkings;
CREATE POLICY "parkings_update_owner" ON public.parkings
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "parkings_delete_owner" ON public.parkings;
CREATE POLICY "parkings_delete_owner" ON public.parkings
  FOR DELETE TO authenticated
  USING (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('owner', 'admin')
    )
  );
