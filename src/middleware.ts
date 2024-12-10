import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Check if user is authenticated and email is verified
  if (session?.user.email_confirmed_at) {
    // Allow access to authenticated routes
    return res
  }

  // Redirect to login if accessing protected routes
  if (req.nextUrl.pathname.startsWith('/(authenticated)')) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/(authenticated)/:path*']
} 