-- Debug script to check wishlist data
-- Check if the friends' wishlist lists exist
SELECT 'Friends wishlist lists:' as debug_type;
SELECT id, user_id, name, type 
FROM lists 
WHERE id IN ('8ca4331e-3926-4206-86dc-478d8449c493', '384ebeeb-566d-4672-8d7a-d8efd0fa6e58');

-- Check if there are any items for these lists
SELECT 'Items for friends wishlist lists:' as debug_type;
SELECT li.*, l.user_id, l.name as list_name
FROM list_items li
JOIN lists l ON li.list_id = l.id
WHERE li.list_id IN ('8ca4331e-3926-4206-86dc-478d8449c493', '384ebeeb-566d-4672-8d7a-d8efd0fa6e58');

-- Check all wishlist lists and their item counts
SELECT 'All wishlist lists with item counts:' as debug_type;
SELECT l.id, l.user_id, l.name, l.type, COUNT(li.id) as item_count
FROM lists l
LEFT JOIN list_items li ON l.id = li.list_id
WHERE l.type = 'wishlist'
GROUP BY l.id, l.user_id, l.name, l.type
ORDER BY l.user_id;

-- Check if Ana (one of the friends) has any items in any list
SELECT 'Ana''s lists and items:' as debug_type;
SELECT l.id as list_id, l.name, l.type, li.title, li.tmdb_id
FROM lists l
LEFT JOIN list_items li ON l.id = li.list_id
WHERE l.user_id IN ('8ba6becd-93aa-4c29-ad46-33fba53b5d14', '9a22c6ea-15d6-4fa7-ab96-fb8c926b19a8')
ORDER BY l.user_id, l.type, li.title;
