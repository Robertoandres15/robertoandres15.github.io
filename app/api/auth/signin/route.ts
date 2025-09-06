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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

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
  } catch (error) {
    console.error("[v0] Server auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
