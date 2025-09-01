-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, username, display_name, bio, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data ->> 'bio', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default wishlist and recommendations lists
  INSERT INTO public.lists (user_id, name, description, type, is_public)
  VALUES 
    (NEW.id, 'My Wishlist', 'Movies and shows I want to watch', 'wishlist', true),
    (NEW.id, 'My Recommendations', 'Movies and shows I recommend', 'recommendations', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to create feed activities
CREATE OR REPLACE FUNCTION public.create_feed_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create activity for list creation
  IF TG_TABLE_NAME = 'lists' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.feed_activities (user_id, activity_type, target_type, target_id, metadata)
    VALUES (NEW.user_id, 'created_list', 'list', NEW.id, jsonb_build_object('list_name', NEW.name, 'list_type', NEW.type));
  END IF;

  -- Create activity for adding items to lists
  IF TG_TABLE_NAME = 'list_items' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.feed_activities (user_id, activity_type, target_type, target_id, metadata)
    SELECT l.user_id, 'added_to_list', 'list_item', NEW.id, 
           jsonb_build_object('title', NEW.title, 'list_name', l.name, 'media_type', NEW.media_type)
    FROM public.lists l WHERE l.id = NEW.list_id;
  END IF;

  -- Create activity for friend acceptance
  IF TG_TABLE_NAME = 'friends' AND TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    INSERT INTO public.feed_activities (user_id, activity_type, target_type, target_id, metadata)
    VALUES (NEW.user_id, 'became_friends', 'user', NEW.friend_id, jsonb_build_object());
    INSERT INTO public.feed_activities (user_id, activity_type, target_type, target_id, metadata)
    VALUES (NEW.friend_id, 'became_friends', 'user', NEW.user_id, jsonb_build_object());
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for feed activities
DROP TRIGGER IF EXISTS create_list_activity ON public.lists;
CREATE TRIGGER create_list_activity
  AFTER INSERT ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feed_activity();

DROP TRIGGER IF EXISTS create_list_item_activity ON public.list_items;
CREATE TRIGGER create_list_item_activity
  AFTER INSERT ON public.list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feed_activity();

DROP TRIGGER IF EXISTS create_friend_activity ON public.friends;
CREATE TRIGGER create_friend_activity
  AFTER UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION public.create_feed_activity();
