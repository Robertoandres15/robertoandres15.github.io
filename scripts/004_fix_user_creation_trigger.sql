-- Fixed user creation trigger to handle database errors properly
-- Function to handle new user creation (fixed version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user record
  INSERT INTO public.users (id, username, display_name, bio, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data ->> 'bio', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default lists only if user was successfully created
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.lists (user_id, name, description, type, is_public)
    VALUES 
      (NEW.id, 'My Wishlist', 'Movies and shows I want to watch', 'wishlist', true),
      (NEW.id, 'My Recommendations', 'Movies and shows I recommend', 'recommendations', true);
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
