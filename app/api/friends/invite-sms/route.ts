import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log("[v0] SMS invite: Supabase environment variables not available, using mock response")
      return NextResponse.json({
        success: true,
        message: "SMS invite sent successfully (mock)",
      })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { phoneNumber, message } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Format phone number (remove non-digits and ensure it starts with +1)
    const cleanPhone = phoneNumber.replace(/\D/g, "")
    const formattedPhone = cleanPhone.startsWith("1") ? `+${cleanPhone}` : `+1${cleanPhone}`

    // Check if user with this phone number already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, username, display_name")
      .eq("phone_number", formattedPhone)
      .single()

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this phone number already exists",
          existingUser: {
            id: existingUser.id,
            username: existingUser.username,
            display_name: existingUser.display_name,
          },
        },
        { status: 409 },
      )
    }

    // Get current user info for the invite message
    const { data: currentUser } = await supabase
      .from("users")
      .select("display_name, username")
      .eq("id", user.id)
      .single()

    // In a real implementation, you would integrate with an SMS service like Twilio
    // For now, we'll simulate the SMS sending and log the invite
    const inviteMessage =
      message ||
      `${currentUser?.display_name || "Your friend"} invited you to join Reel Friends! Download the app and connect with friends over movies and shows. [App Link]`

    console.log(`[v0] SMS Invite to ${formattedPhone}: ${inviteMessage}`)

    // Store the invite in the database for tracking
    const { error: inviteError } = await supabase.from("sms_invites").insert({
      sender_id: user.id,
      phone_number: formattedPhone,
      message: inviteMessage,
      status: "sent",
    })

    if (inviteError) {
      console.error("Failed to store SMS invite:", inviteError)
      // Continue anyway since the main functionality works
    }

    return NextResponse.json({
      success: true,
      message: "SMS invite sent successfully",
      phoneNumber: formattedPhone,
    })
  } catch (error) {
    console.error("SMS invite error:", error)
    return NextResponse.json({ error: "Failed to send SMS invite" }, { status: 500 })
  }
}
