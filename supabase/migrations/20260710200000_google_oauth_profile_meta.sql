-- Prefer Google OAuth metadata fields (full_name / avatar_url / picture) when creating profiles.

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
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    signup_role,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar',
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
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
