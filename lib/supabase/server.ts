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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not available, returning null client")
    console.warn("[v0] URL:", supabaseUrl ? "present" : "missing")
    console.warn("[v0] Anon Key:", supabaseAnonKey ? "present" : "missing")
    return null
  }

  console.log("[v0] Supabase environment variables found, creating client")

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

export { createClient as createServerClient }
