import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
      console.log("Supabase environment variables not available, returning mock payment intent")
      return NextResponse.json({
        success: true,
        clientSecret: "mock_client_secret_123",
        paymentIntentId: "mock_pi_123",
      })
    }

    let supabase
    let user = null

    try {
      supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data?.user
    } catch (error) {
      console.log("Supabase client creation failed, returning mock payment intent")
      return NextResponse.json({
        success: true,
        clientSecret: "mock_client_secret_123",
        paymentIntentId: "mock_pi_123",
      })
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // In a real implementation, you would create a Stripe payment intent here
    // For now, we'll simulate the payment process
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_123`,
      amount: 299, // $2.99 in cents
      currency: "usd",
      status: "requires_payment_method",
    }

    // Create payment record in database
    try {
      await supabase.from("subscription_payments").insert({
        user_id: user.id,
        amount: 2.99,
        currency: "USD",
        status: "pending",
        stripe_payment_intent_id: mockPaymentIntent.id,
      })
    } catch (dbError) {
      console.log("Database insert failed, continuing with mock payment")
    }

    return NextResponse.json({
      success: true,
      clientSecret: mockPaymentIntent.client_secret,
      paymentIntentId: mockPaymentIntent.id,
    })
  } catch (error) {
    console.log("Payment intent creation error:", error)
    return NextResponse.json({
      success: true,
      clientSecret: "mock_client_secret_123",
      paymentIntentId: "mock_pi_123",
    })
  }
}
