export interface User {
  id: string
  username: string
  display_name: string
  bio?: string
  avatar_url?: string
  city?: string
  state?: string
  zip_code?: string
  phone_number?: string
  streaming_services?: string[]
  likes_theaters?: string
  theater_companion?: string
  likes_series?: string
  preferred_series_genres?: string[]
  preferred_movie_genres?: string[]
  created_at: string
  updated_at: string
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: "pending" | "accepted" | "blocked"
  created_at: string
  updated_at: string
}

export interface List {
  id: string
  user_id: string
  name: string
  description?: string
  type: "wishlist" | "recommendations"
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ListItem {
  id: string
  list_id: string
  tmdb_id: number
  media_type: "movie" | "tv"
  title: string
  poster_path?: string
  overview?: string
  release_date?: string
  rating?: number
  note?: string
  added_at: string
}

export interface SocialSignal {
  id: string
  user_id: string
  target_type: "list" | "list_item"
  target_id: string
  signal_type: "like" | "comment" | "share"
  content?: string
  created_at: string
}

export interface FeedActivity {
  id: string
  user_id: string
  activity_type: "added_to_list" | "created_list" | "liked_list" | "commented_on_list" | "became_friends"
  target_type: "list" | "list_item" | "user"
  target_id: string
  metadata?: Record<string, any>
  created_at: string
}

export interface FriendRequest {
  id: string
  user: User
  created_at: string
}
