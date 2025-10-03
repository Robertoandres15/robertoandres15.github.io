"use server"

import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedUserProfile() {
  console.log("[v0] [SERVER ACTION] Getting authenticated user profile")

  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0] [SERVER ACTION] Auth error:", authError)
    return {
      success: false,
      error: "Not authenticated",
      user: null,
      profile: null,
    }
  }

  console.log("[v0] [SERVER ACTION] Authenticated user:", {
    id: user.id,
    email: user.email,
  })

  // Fetch profile - RLS ensures we can only get this user's profile
  const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single()

  if (profileError) {
    console.error("[v0] [SERVER ACTION] Profile error:", profileError)
    return {
      success: false,
      error: profileError.message,
      user: user,
      profile: null,
    }
  }

  // Server-side validation: Ensure profile ID matches authenticated user ID
  if (profile.id !== user.id) {
    console.error("[v0] [SERVER ACTION] SECURITY VIOLATION: Profile ID mismatch!", {
      authenticatedUserId: user.id,
      profileId: profile.id,
    })
    return {
      success: false,
      error: "Security violation: Profile ID mismatch",
      user: user,
      profile: null,
    }
  }

  console.log("[v0] [SERVER ACTION] Profile fetched successfully:", {
    id: profile.id,
    username: profile.username,
    email: user.email,
  })

  return {
    success: true,
    error: null,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
      phone_number: profile.phone_number,
      streaming_services: profile.streaming_services,
      likes_theaters: profile.likes_theaters,
      theater_companion: profile.theater_companion,
      likes_series: profile.likes_series,
      preferred_series_genres: profile.preferred_series_genres,
      preferred_movie_genres: profile.preferred_movie_genres,
    },
  }
}

export async function updateUserProfile(formData: {
  display_name: string
  bio?: string
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
}) {
  console.log("[v0] [SERVER ACTION] Updating user profile")

  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0] [SERVER ACTION] Auth error:", authError)
    return {
      success: false,
      error: "Not authenticated",
    }
  }

  // Update profile - RLS ensures we can only update this user's profile
  const { error: updateError } = await supabase
    .from("users")
    .update({
      display_name: formData.display_name,
      bio: formData.bio || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      phone_number: formData.phone_number || null,
      streaming_services: formData.streaming_services || [],
      likes_theaters: formData.likes_theaters || null,
      theater_companion: formData.theater_companion || null,
      likes_series: formData.likes_series || null,
      preferred_series_genres: formData.preferred_series_genres || [],
      preferred_movie_genres: formData.preferred_movie_genres || [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("[v0] [SERVER ACTION] Update error:", updateError)
    return {
      success: false,
      error: updateError.message,
    }
  }

  console.log("[v0] [SERVER ACTION] Profile updated successfully")

  return {
    success: true,
    error: null,
  }
}
