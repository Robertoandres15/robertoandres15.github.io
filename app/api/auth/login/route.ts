import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Server auth - Processing login request")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[v0] Server auth - Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookies().set({ name, value: "", ...options })
        },
      },
    })

    console.log("[v0] Server auth - Attempting authentication")

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log("[v0] Server auth - Authentication failed:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Server auth - Authentication successful")

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error: any) {
    console.log("[v0] Server auth - Unexpected error:", error.message)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
