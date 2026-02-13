import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files only
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // --- Always refresh Supabase session (including /api routes) ---
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This refreshes the session token in cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // For API routes, landing page, and auth pages: just refresh session, no redirects
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api")
  ) {
    return supabaseResponse
  }

  // --- Protected portal routes: redirect unauthenticated users ---
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // --- Role-based route guard using JWT metadata (no DB query) ---
  const role = (user.user_metadata?.role as string) || "citizen"
  const rolePathMap: Record<string, string> = {
    citizen: "/citizen",
    worker: "/worker",
    admin: "/admin",
  }
  const allowedPath = rolePathMap[role]
  if (allowedPath && !pathname.startsWith(allowedPath)) {
    const url = request.nextUrl.clone()
    url.pathname = allowedPath
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
