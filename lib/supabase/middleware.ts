import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[v0] Supabase environment variables not available, skipping auth")
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check - Path:", request.nextUrl.pathname, "User:", !!user)

    // Allow access to auth pages, home page, public assets, and Vercel internal paths
    const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
    const isHomePage = request.nextUrl.pathname === "/"
    const isPublicAsset =
      request.nextUrl.pathname.startsWith("/_next") ||
      request.nextUrl.pathname.startsWith("/api") ||
      request.nextUrl.pathname.startsWith("/_vercel") ||
      request.nextUrl.pathname.includes(".")

    if (!user && !isAuthPage && !isHomePage && !isPublicAsset) {
      console.log("[v0] Redirecting to login - no user and not on auth page")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    // If user is authenticated and on auth pages, redirect to feed
    if (user && isAuthPage) {
      console.log("[v0] Redirecting authenticated user to feed")
      const url = request.nextUrl.clone()
      url.pathname = "/feed"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.log("[v0] Supabase middleware error:", error)
    // Continue without authentication rather than crashing
  }

  return supabaseResponse
}
