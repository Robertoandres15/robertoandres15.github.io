import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Return early to avoid Edge Runtime compatibility issues
  // Authentication will be handled at the page level instead
  console.warn("[v0] Middleware authentication disabled for Edge Runtime compatibility")
  return NextResponse.next({
    request,
  })
}
