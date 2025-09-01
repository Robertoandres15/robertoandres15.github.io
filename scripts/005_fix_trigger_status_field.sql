-- Fix the create_feed_activity function to properly handle different table contexts
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

  -- Only check status field when operating on friends table
  IF TG_TABLE_NAME = 'friends' AND TG_OP = 'UPDATE' AND OLD IS NOT NULL AND NEW IS NOT NULL THEN
    IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
      INSERT INTO public.feed_activities (user_id, activity_type, target_type, target_id, metadata)
      VALUES (NEW.user_id, 'became_friends', 'user', NEW.friend_id, jsonb_build_object());
      INSERT INTO public.feed_activities (user_id, activity_type, target_type, target_id, metadata)
      VALUES (NEW.friend_id, 'became_friends', 'user', NEW.user_id, jsonb_build_object());
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
