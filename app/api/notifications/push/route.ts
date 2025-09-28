import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const { subscription, payload } = await request.json()

    if (!subscription || !payload) {
      return NextResponse.json({ error: "Missing subscription or payload" }, { status: 400 })
    }

    await webpush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: "normal",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending push notification:", error)
    return NextResponse.json({ error: "Failed to send push notification" }, { status: 500 })
  }
}
