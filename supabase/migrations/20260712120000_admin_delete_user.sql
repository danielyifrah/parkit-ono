-- Allow admins to permanently delete a user (auth + profile).
-- Cascades: profiles → parkings (owner), bookings, payment_methods.

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_role TEXT;
  target_name TEXT;
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete yourself';
  END IF;

  SELECT role, name INTO target_role, target_name
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_role IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF target_role = 'admin' THEN
    RAISE EXCEPTION 'cannot delete admin';
  END IF;

  -- Removes auth.users → profiles (ON DELETE CASCADE) → parkings, bookings, etc.
  DELETE FROM auth.users WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated;
