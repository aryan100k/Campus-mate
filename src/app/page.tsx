import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-primary p-8">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-text-primary drop-shadow-lg">Campus Mate</h1>
          <p className="text-xl text-text-primary/90 drop-shadow-md">Find your perfect match at ISB</p>
        </div>
        
        <div className="space-y-4">
          <Button 
            asChild 
            variant="secondary"
            className="w-full h-12 text-lg font-semibold bg-white text-campus-pink hover:bg-white/90 hover:scale-105 shadow-lg transition-all duration-300"
          >
            <Link href="/auth/login">Log In</Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline" 
            className="w-full h-12 text-lg font-semibold border-white text-text-primary hover:bg-white hover:text-campus-pink hover:scale-105 shadow-lg transition-all duration-300"
          >
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}