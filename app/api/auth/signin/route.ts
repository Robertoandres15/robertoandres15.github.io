import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not available" }, { status: 503 })
    }

    console.log("[v0] Attempting server-side authentication...")

    let authResult
    try {
      authResult = await supabase.auth.signInWithPassword({
        email,
        password,
      })
    } catch (authError: any) {
      console.error("[v0] Supabase auth threw error:", authError)

      // Check if this is a JSON parsing error (CORS/network issue)
      if (authError.message && authError.message.includes("Unexpected token")) {
        console.error("[v0] JSON parsing error detected - likely CORS/Site URL issue")
        return NextResponse.json(
          {
            error: "Authentication service unavailable. Please check Supabase Site URL configuration.",
            details: "The Supabase project may not be configured to allow requests from this domain.",
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          error: "Authentication request failed",
          details: authError.message || "Unknown error",
        },
        { status: 500 },
      )
    }

    const { data, error } = authResult

    if (error) {
      console.log("[v0] Server auth error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.session) {
      return NextResponse.json({ error: "No session created" }, { status: 400 })
    }

    console.log("[v0] Server auth success for user:", data.user?.email)

    return NextResponse.json({
      user: data.user,
      session: data.session,
    })
  } catch (error: any) {
    console.error("[v0] Server auth error:", error)

    if (error.message && error.message.includes("Unexpected token")) {
      return NextResponse.json(
        {
          error: "Invalid response from authentication service",
          details: "This is likely a CORS or Site URL configuration issue in Supabase",
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
