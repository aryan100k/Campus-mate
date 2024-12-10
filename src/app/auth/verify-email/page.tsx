'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-3xl shadow-xl text-center">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-campus-pink">Check Your Email</h1>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              We've sent a verification link to your ISB email address. 
              Please click the link to verify your account.
            </p>
            
            <p className="text-sm text-gray-500">
              Don't see the email? Check your spam folder.
            </p>
          </div>

          <div className="pt-4">
            <Button 
              asChild
              variant="outline" 
              className="text-campus-pink hover:text-white hover:bg-campus-pink"
            >
              <Link href="/auth/login">
                Return to Login
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
