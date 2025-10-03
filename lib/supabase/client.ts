import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return client
}

export async function clearSupabaseSession() {
  console.log("[v0] Starting session cleanup...")

  if (client) {
    try {
      const {
        data: { session },
      } = await client.auth.getSession()

      if (session) {
        console.log("[v0] Active session found, signing out...")
        await client.auth.signOut()
        console.log("[v0] Supabase sign-out successful")
      } else {
        console.log("[v0] No active session, skipping sign-out")
      }
    } catch (error) {
      console.error("[v0] Error during session check/sign-out:", error)
    }
  }

  // Step 2: Clear all Supabase cookies
  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
    if (name.startsWith("sb-") || name.includes("supabase")) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
    }
  }

  // Step 3: Clear all localStorage items
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.startsWith("sb-") || key.includes("supabase") || key.includes("reel-friends"))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))

  // Step 4: Clear sessionStorage
  const sessionKeysToRemove: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && (key.startsWith("sb-") || key.includes("supabase") || key.includes("reel-friends"))) {
      sessionKeysToRemove.push(key)
    }
  }
  sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key))

  console.log("[v0] Cleared all Supabase session data and app cache")

  // Step 5: Clear the singleton client
  client = null
}
