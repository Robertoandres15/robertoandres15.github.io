import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Auth callback route hit")

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/feed"

  console.log("[v0] Auth callback - code:", code ? "present" : "missing")
  console.log("[v0] Auth callback - next:", next)

  if (code) {
    const forwardedHost = request.headers.get("x-forwarded-host")
    const isLocalEnv = process.env.NODE_ENV === "development"

    let redirectUrl: string
    if (isLocalEnv) {
      redirectUrl = `http://localhost:3000${next}`
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`
    } else {
      redirectUrl = `${origin}${next}`
    }

    const response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("[v0] Auth callback error:", error)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }

    console.log("[v0] Auth callback success - user:", data.user?.email)
    return response
  }

  console.log("[v0] Auth callback - no code, redirecting to login")
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
