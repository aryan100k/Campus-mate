'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Create Supabase client directly in AuthContext
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AuthContextType {
  user: User | null
  loading: boolean
  profile: any
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('AuthProvider initializing')
    setLoading(true)
    
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Session check:', { 
        hasSession: Boolean(session), 
        userId: session?.user?.id,
        error,
        pathname: window.location.pathname
      })

      if (session?.user) {
        console.log('Setting user:', session.user.id)
        setUser(session.user)
        fetchProfile(session.user.id).finally(() => {
          setLoading(false)
          console.log('Auth initialization complete:', {
            userId: session.user.id,
            hasProfile: Boolean(profile)
          })
        })
      } else {
        console.log('No active session, checking route')
        setUser(null)
        setProfile(null)
        setLoading(false)
        
        // Only redirect if we're on a protected route
        const isPublicRoute = 
          window.location.pathname.startsWith('/auth/') || 
          window.location.pathname === '/login' ||
          window.location.pathname === '/'
        
        if (!isPublicRoute) {
          console.log('Redirecting to login from:', window.location.pathname)
          router.push('/auth/login')
        }
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { event, userId: session?.user?.id })
      
      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [router])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*, preferences')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Profile fetch error:', error)
        throw error
      }

      console.log('Profile fetched:', data)
      setProfile(data)
      return data
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      return null
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, profile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 