export async function GET() {
  const supabaseUrl = "https://decmqllofkinlbtxczhu.supabase.com"
  const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwNjksImV4cCI6MjA3MjE1OTA2OX0.p1Gu9B3BbMq-_5NxsT69F22hqU-6dVkCGUZV_ZOc5ng"

  console.log("[v0] Testing Supabase project accessibility...")

  try {
    // Test 1: Basic REST API endpoint
    const restResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] REST API Response:", {
      status: restResponse.status,
      statusText: restResponse.statusText,
      headers: Object.fromEntries(restResponse.headers.entries()),
    })

    const restText = await restResponse.text()
    console.log("[v0] REST API Response body:", restText.substring(0, 200))

    // Test 2: Auth endpoint
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] Auth API Response:", {
      status: authResponse.status,
      statusText: authResponse.statusText,
      headers: Object.fromEntries(authResponse.headers.entries()),
    })

    const authText = await authResponse.text()
    console.log("[v0] Auth API Response body:", authText.substring(0, 200))

    return Response.json({
      success: true,
      tests: {
        rest: {
          status: restResponse.status,
          statusText: restResponse.statusText,
          body: restText.substring(0, 200),
        },
        auth: {
          status: authResponse.status,
          statusText: authResponse.statusText,
          body: authText.substring(0, 200),
        },
      },
    })
  } catch (error) {
    console.error("[v0] Supabase connectivity test failed:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 },
    )
  }
}
