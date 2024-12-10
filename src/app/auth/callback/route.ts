import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    try {
      // Exchange code for session
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) throw error

      // Create initial profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: user?.id,
            email: user?.email,
            created_at: new Date().toISOString()
          }
        ])

      if (profileError) throw profileError

      // Redirect to profile setup
      return NextResponse.redirect(requestUrl.origin + '/auth/setup-profile')
    } catch (error) {
      console.error('Error in callback:', error)
      return NextResponse.redirect(requestUrl.origin + '/auth/login?error=callback_error')
    }
  }

  return NextResponse.redirect(requestUrl.origin)
} 