import { createServerClient } from "@supabase/ssr"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  console.log("[v0] Environment variable check:")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log("[v0] SUPABASE_SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log(
    "[v0] All process.env keys:",
    Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
  )

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fallback to hardcoded values if Vercel environment variables aren't available
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Vercel environment variables not available, using hardcoded fallback values")
    supabaseUrl = "https://decmqllofkinlbtxczhu.supabase.com"
    supabaseAnonKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwNjksImV4cCI6MjA3MjE1OTA2OX0.p1Gu9B3BbMq-_5NxsT69F22hqU-6dVkCGUZV_ZOc5ng"
    console.log("[v0] Using fallback Supabase URL:", supabaseUrl)
    console.log("[v0] Using fallback anon key:", supabaseAnonKey ? "present" : "missing")
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase configuration completely unavailable, returning null client")
    return null
  }

  console.log("[v0] Supabase configuration available, creating client")

  try {
    // Check if we're in a server environment that supports next/headers
    if (typeof window !== "undefined") {
      // We're in a browser environment, create a basic client without cookies
      return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            /* no-op in browser */
          },
        },
      })
    }

    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    })
  } catch (error) {
    // Fallback for environments where next/headers is not available
    console.warn("[v0] next/headers not available, creating client without cookie support:", error)
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          /* no-op fallback */
        },
      },
    })
  }
}

export function getServiceRoleKey(): string | null {
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    console.warn("[v0] Service role key not in environment, using hardcoded fallback")
    serviceRoleKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4MzA2OSwiZXhwIjoyMDcyMTU5MDY5fQ.4_ZdC3UxlSKvXfDppe0ARA6LHv_xkY7nIXxgb2_q12I"
  }

  return serviceRoleKey
}

export { createClient as createServerClient }
