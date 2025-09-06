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

    try {
      const authResult = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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
    } catch (authError: any) {
      console.error("[v0] Supabase auth threw error:", authError)

      const errorMessage = authError.message || authError.toString()
      const isJsonError =
        errorMessage.includes("Unexpected token") ||
        errorMessage.includes("is not valid JSON") ||
        errorMessage.includes("Invalid response")

      if (isJsonError) {
        console.error("[v0] JSON parsing error detected - CORS/Site URL configuration issue")
        return NextResponse.json(
          {
            error: "Supabase Site URL Configuration Required",
            details: `Your Supabase project needs to be configured to allow requests from this domain. 
                     Go to your Supabase Dashboard → Authentication → URL Configuration and add: 
                     ${request.headers.get("origin") || "this domain"} to the Site URL field.`,
            action: "Update Supabase Site URL Configuration",
            corsIssue: true,
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          error: "Authentication request failed",
          details: errorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Server auth error:", error)

    const errorMessage = error.message || error.toString()
    if (errorMessage.includes("Unexpected token") || errorMessage.includes("is not valid JSON")) {
      return NextResponse.json(
        {
          error: "Invalid response from authentication service",
          details:
            "This is a CORS or Site URL configuration issue in Supabase. Please add your domain to the Supabase Site URL configuration.",
          corsIssue: true,
        },
        { status: 503 },
      )
    }

    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
