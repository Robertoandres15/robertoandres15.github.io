import { createBrowserClient } from "@supabase/ssr"

export async function testSupabaseConnectivity() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://decmqllofkinlbtxczhu.supabase.com"

  try {
    console.log("[v0] Testing Supabase connectivity to:", supabaseUrl)

    // Test basic connectivity to Supabase project
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwNjksImV4cCI6MjA3MjE1OTA2OX0.p1Gu9B3BbMq-_5NxsT69F22hqU-6dVkCGUZV_ZOc5ng",
      },
      signal: AbortSignal.timeout(10000),
    })

    console.log("[v0] Supabase connectivity test - Status:", response.status)
    console.log("[v0] Supabase connectivity test - Headers:", Object.fromEntries(response.headers.entries()))

    if (response.status === 200 || response.status === 404) {
      console.log("[v0] Supabase project is accessible")
      return true
    } else {
      console.error("[v0] Supabase project returned unexpected status:", response.status)
      return false
    }
  } catch (error) {
    console.error("[v0] Supabase connectivity test failed:", error)
    return false
  }
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://decmqllofkinlbtxczhu.supabase.com"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlY21xbGxvZmtpbmxidHhjemh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwNjksImV4cCI6MjA3MjE1OTA2OX0.p1Gu9B3BbMq-_5NxsT69F22hqU-6dVkCGUZV_ZOc5ng"

  console.log("[v0] Creating browser Supabase client with credentials")
  console.log("[v0] Supabase URL:", supabaseUrl)
  console.log("[v0] Anon Key available:", !!supabaseAnonKey)

  testSupabaseConnectivity()

  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (url, options = {}) => {
        console.log("[v0] Supabase fetch request to:", url)
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(15000), // 15 second timeout
        }).catch((error) => {
          console.error("[v0] Supabase fetch error:", error)
          throw new Error(`Network request failed: ${error.message}`)
        })
      },
    },
  })

  return client
}
