import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return client
}

export function clearSupabaseSession() {
  // Clear all Supabase cookies
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
    if (name.startsWith("sb-") || name.includes("supabase")) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    }
  }

  // Clear all localStorage items
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))

  // Clear sessionStorage
  const sessionKeysToRemove: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
      sessionKeysToRemove.push(key)
    }
  }
  sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))

  // Reset the client singleton
  client = null

  console.log("[v0] Cleared all Supabase session data")
}
