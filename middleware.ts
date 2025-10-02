import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // Skip middleware for static files, API routes, and auth pages
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/_vercel") ||
    request.nextUrl.pathname.includes(".") ||
    request.nextUrl.pathname === "/"
  ) {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
