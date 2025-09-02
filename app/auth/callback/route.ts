import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/onboarding"

  console.log("[v0] Auth callback - Request details:", {
    url: request.url,
    origin,
    code: code ? "present" : "missing",
    next,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
  })

  const getSafeRedirectUrl = () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    const isLocalEnv = process.env.NODE_ENV === "development"

    console.log("[v0] Auth callback - Environment check:", {
      siteUrl: siteUrl ? "configured" : "missing",
      siteUrlValue: siteUrl,
      isLocalEnv,
      origin,
      userAgent: request.headers.get("user-agent"),
    })

    // Always prioritize NEXT_PUBLIC_SITE_URL in production
    if (siteUrl && siteUrl.trim() !== "") {
      console.log("[v0] Auth callback - Using configured site URL")
      return siteUrl
    }

    // For local development, use localhost
    if (isLocalEnv) {
      console.log("[v0] Auth callback - Using localhost for development")
      return "http://localhost:3000"
    }

    // Last resort: try to construct from headers, but avoid vercel.com domains
    const forwardedHost = request.headers.get("x-forwarded-host")
    if (forwardedHost && !forwardedHost.includes("vercel.com") && !forwardedHost.includes("vercel.app")) {
      console.log("[v0] Auth callback - Using forwarded host:", forwardedHost)
      return `https://${forwardedHost}`
    }

    // If all else fails, use a default that won't redirect to Vercel
    console.error("[v0] Auth callback - No safe redirect URL found, using fallback")
    return "https://reel-friends.vercel.app" // Replace with your actual domain
  }

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error("[v0] Supabase environment variables not available in auth callback")
        const redirectUrl = getSafeRedirectUrl()
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
        const redirectUrl = getSafeRedirectUrl()
        console.log("[v0] Auth callback - Successful auth, redirecting to:", `${redirectUrl}${next}`)
        return NextResponse.redirect(`${redirectUrl}${next}`)
      } else {
        console.error("[v0] Auth callback - Session exchange error:", error)
        const redirectUrl = getSafeRedirectUrl()
        return NextResponse.redirect(`${redirectUrl}/auth/auth-code-error`)
      }
    } catch (error) {
      console.error("[v0] Auth callback error:", error)
      const redirectUrl = getSafeRedirectUrl()
      return NextResponse.redirect(`${redirectUrl}${next}`)
    }
  }

  const redirectUrl = getSafeRedirectUrl()
  console.log(
    "[v0] Auth callback - No code provided, redirecting to error page:",
    `${redirectUrl}/auth/auth-code-error`,
  )
  return NextResponse.redirect(`${redirectUrl}/auth/auth-code-error`)
}
