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

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw profileError
      }

      // If profile doesn't exist, create initial profile
      if (!profile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: user?.id,
              email: user?.email,
              created_at: new Date().toISOString()
            }
          ])

        if (insertError) throw insertError
      }

      // Always redirect to login after verification
      return NextResponse.redirect(requestUrl.origin + '/auth/login')
    } catch (error) {
      console.error('Error in callback:', error)
      return NextResponse.redirect(requestUrl.origin + '/auth/login?error=callback_error')
    }
  }

  return NextResponse.redirect(requestUrl.origin)
} 