import { createServerClient } from "@supabase/ssr"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const supabaseUrl = "https://decmqllofkinlbtxczhu.supabase.com"
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwNjksImV4cCI6MjA3MjE1OTA2OX0.p1Gu9B3BbMq-_5NxsT69F22hqU-6dVkCGUZV_ZOc5ng"

  console.log("[v0] Creating Supabase client with hardcoded credentials")

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
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4MzA2OSwiZXhwIjoyMDcyMTU5MDY5fQ.4_ZdC3UxlSKvXfDppe0ARA6LHv_xkY7nIXxgb2_q12I"
}

export { createClient as createServerClient }
