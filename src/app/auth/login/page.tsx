'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Sign in the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Check if profile exists and is complete
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, program, gender, age, photos')
        .eq('id', authData.user.id)

      // Handle profile check
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      const profile = profiles?.[0]
      
      // If no profile exists or profile is incomplete, redirect to setup
      if (!profile || !isProfileComplete(profile)) {
        router.push('/auth/setup-profile')
        return
      }

      // Profile exists and is complete, redirect to discover
      router.push('/discover')

    } catch (error) {
      console.error('Login error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to check if profile is complete
  const isProfileComplete = (profile: any) => {
    return Boolean(
      profile.full_name &&
      profile.program &&
      profile.gender &&
      profile.age &&
      profile.photos
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-campus-pink">Welcome Back!</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-campus-pink hover:text-campus-pink-dark">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}