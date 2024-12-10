'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const validateISBEmail = (email: string) => {
    const isbEmailRegex = /^[a-zA-Z0-9._%+-]+@isb\.edu$/
    return isbEmailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validate email
    if (!validateISBEmail(email)) {
      setError('Please use a valid @isb.edu email address')
      setIsLoading(false)
      return
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (signUpError) throw signUpError

      // Show success message and redirect
      alert('Please check your ISB email for the verification link')
      router.push('/auth/verify-email')
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-center">
          <h1 className="mt-6 text-4xl font-bold text-campus-pink">Campus Mate</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-600">Join your campus community!</h2>
          <p className="mt-2 text-sm text-gray-500">Sign up with your college email</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="email-address" className="text-gray-700">College Email</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                pattern=".*@isb\.edu$"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 rounded-full"
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">Please use your @isb.edu email address</p>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 rounded-full"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-gray-700">Confirm Password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 rounded-full"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <p className="text-action-error text-sm text-center">{error}</p>
          )}

          <div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-white font-bold py-2 px-4 rounded-full transition duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Signing up...' : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/auth/login" className="font-medium text-campus-pink hover:text-campus-pink-dark">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}