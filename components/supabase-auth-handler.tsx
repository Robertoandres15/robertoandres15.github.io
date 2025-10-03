"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function SupabaseAuthHandler() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Immediately check for session errors and clear if needed
    const checkAndClearInvalidSession = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.log("[v0] Session error detected:", error.message)

          // If user doesn't exist, clear all auth data
          if (
            error.message.includes("User from sub claim in JWT does not exist") ||
            error.message.includes("user_not_found") ||
            error.status === 403
          ) {
            console.log("[v0] Invalid user session detected, clearing all auth data")

            // Sign out to clear server-side session
            await supabase.auth.signOut()

            // Clear all Supabase-related items from localStorage
            if (typeof window !== "undefined") {
              const keysToRemove: string[] = []
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
                  keysToRemove.push(key)
                }
              }
              keysToRemove.forEach((key) => localStorage.removeItem(key))

              // Clear all Supabase cookies
              document.cookie.split(";").forEach((cookie) => {
                const cookieName = cookie.split("=")[0].trim()
                if (cookieName.startsWith("sb-") || cookieName.includes("supabase")) {
                  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
                }
              })
            }

            // Redirect to login
            router.push("/auth/login")
            router.refresh()
          }
        }
      } catch (err) {
        console.error("[v0] Error checking session:", err)
        // If there's any error, try to clear session
        try {
          await supabase.auth.signOut()
        } catch (signOutErr) {
          console.error("[v0] Error signing out:", signOutErr)
        }
      }
    }

    // Run immediately
    checkAndClearInvalidSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || event === "USER_DELETED" || event === "INITIAL_SESSION") {
        console.log("[v0] Auth state changed:", event)
      }

      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        console.log("[v0] User signed out or deleted, redirecting to login")
        router.push("/auth/login")
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}
