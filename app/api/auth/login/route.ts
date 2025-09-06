import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Server auth - Processing login request")

    const supabase = createServerClient(
      "https://decmqllofkinlbtxczhu.supabase.com",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwNjksImV4cCI6MjA3MjE1OTA2OX0.p1Gu9B3BbMq-_5NxsT69F22hqU-6dVkCGUZV_ZOc5ng",
      {
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
      },
    )

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
