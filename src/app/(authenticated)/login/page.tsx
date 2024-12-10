'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically handle the login logic
    console.log('Login attempted with:', email, password)
    router.push('/discover')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 p-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pink-600">Campus Mate</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-600">Welcome back!</h2>
          <p className="mt-2 text-sm text-gray-500">Sign in to connect with your campus community</p>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 rounded-full"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 rounded-full"
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-full transition duration-300">
              Sign in
            </Button>
          </div>
        </form>
        <div className="text-center">
          <a href="#" className="font-medium text-pink-600 hover:text-pink-500">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  )
}

