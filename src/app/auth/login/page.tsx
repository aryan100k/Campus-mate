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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log('Login successful:', data)
      router.push('/discover')

    } catch (error) {
      console.error('Login error:', error)
      setError('Invalid login credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-center">
          <h1 className="mt-6 text-4xl font-bold text-campus-pink">Welcome Back!</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to your account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 rounded-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 rounded-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <p className="text-action-error text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-white font-bold py-2 px-4 rounded-full transition duration-300"
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