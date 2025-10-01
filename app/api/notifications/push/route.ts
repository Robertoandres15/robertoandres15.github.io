import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Configure web-push with VAPID keys at runtime
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    if (!publicKey || !privateKey) {
      console.error("[v0] Missing VAPID keys")
      return NextResponse.json({ error: "Push notifications not configured" }, { status: 500 })
    }

    webpush.setVapidDetails("mailto:your-email@example.com", publicKey, privateKey)

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
