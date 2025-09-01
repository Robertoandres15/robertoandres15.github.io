import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/onboarding"

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[v0] Supabase environment variables not available in auth callback")
        const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
        return NextResponse.redirect(`${redirectUrl}${next}`)
      }

      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options })
            })
          },
        },
      })

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        if (siteUrl) {
          // Use the configured site URL (production domain)
          return NextResponse.redirect(`${siteUrl}${next}`)
        } else if (isLocalEnv) {
          // Local development - use origin
          return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
          return NextResponse.redirect(`${origin}${next}`)
        }
      }
    } catch (error) {
      console.error("[v0] Auth callback error:", error)
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
      return NextResponse.redirect(`${redirectUrl}${next}`)
    }
  }

  const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || origin
  return NextResponse.redirect(`${redirectUrl}/auth/auth-code-error`)
}
