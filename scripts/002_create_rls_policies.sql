-- Users table policies
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_delete_own" ON public.users FOR DELETE USING (auth.uid() = id);

-- Friends table policies
CREATE POLICY "friends_select_own" ON public.friends FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY "friends_insert_own" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "friends_update_own" ON public.friends FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY "friends_delete_own" ON public.friends FOR DELETE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Lists table policies
CREATE POLICY "lists_select_public_or_own" ON public.lists FOR SELECT USING (
  is_public = true OR auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.friends 
    WHERE (user_id = auth.uid() AND friend_id = public.lists.user_id AND status = 'accepted')
    OR (friend_id = auth.uid() AND user_id = public.lists.user_id AND status = 'accepted')
  )
);
CREATE POLICY "lists_insert_own" ON public.lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lists_update_own" ON public.lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "lists_delete_own" ON public.lists FOR DELETE USING (auth.uid() = user_id);

-- List items table policies
CREATE POLICY "list_items_select_via_list" ON public.list_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    WHERE lists.id = list_items.list_id AND (
      lists.is_public = true OR auth.uid() = lists.user_id OR 
      EXISTS (
        SELECT 1 FROM public.friends 
        WHERE (user_id = auth.uid() AND friend_id = lists.user_id AND status = 'accepted')
        OR (friend_id = auth.uid() AND user_id = lists.user_id AND status = 'accepted')
      )
    )
  )
);
CREATE POLICY "list_items_insert_own_list" ON public.list_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.lists 
    WHERE lists.id = list_items.list_id AND auth.uid() = lists.user_id
  )
);
CREATE POLICY "list_items_update_own_list" ON public.list_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    WHERE lists.id = list_items.list_id AND auth.uid() = lists.user_id
  )
);
CREATE POLICY "list_items_delete_own_list" ON public.list_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.lists 
    WHERE lists.id = list_items.list_id AND auth.uid() = lists.user_id
  )
);

-- Social signals table policies
CREATE POLICY "social_signals_select_public" ON public.social_signals FOR SELECT USING (
  target_type = 'list' AND EXISTS (
    SELECT 1 FROM public.lists 
    WHERE lists.id = social_signals.target_id AND (
      lists.is_public = true OR auth.uid() = lists.user_id OR 
      EXISTS (
        SELECT 1 FROM public.friends 
        WHERE (user_id = auth.uid() AND friend_id = lists.user_id AND status = 'accepted')
        OR (friend_id = auth.uid() AND user_id = lists.user_id AND status = 'accepted')
      )
    )
  )
);
CREATE POLICY "social_signals_insert_own" ON public.social_signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "social_signals_update_own" ON public.social_signals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "social_signals_delete_own" ON public.social_signals FOR DELETE USING (auth.uid() = user_id);

-- Feed activities table policies
CREATE POLICY "feed_activities_select_friends" ON public.feed_activities FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.friends 
    WHERE (user_id = auth.uid() AND friend_id = feed_activities.user_id AND status = 'accepted')
    OR (friend_id = auth.uid() AND user_id = feed_activities.user_id AND status = 'accepted')
  )
);
CREATE POLICY "feed_activities_insert_own" ON public.feed_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feed_activities_update_own" ON public.feed_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "feed_activities_delete_own" ON public.feed_activities FOR DELETE USING (auth.uid() = user_id);
