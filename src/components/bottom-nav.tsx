'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, MessageCircle, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

const navItems = [
  { href: '/discover', icon: Home, label: 'Discover' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [matchCount, setMatchCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    let mounted = true

    const fetchMatchCount = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('matches')
          .select('id')
          .eq('status', 'active')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        if (!error && mounted && data) {
          setMatchCount(data.length)
        }
      } catch (error) {
        console.error('Error fetching matches:', error)
      }
    }

    fetchMatchCount()

    return () => {
      mounted = false
    }
  }, [user?.id])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-3xl shadow-lg">
      <div className="flex justify-around">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center p-2 relative ${
              pathname === href ? 'text-pink-600' : 'text-gray-500'
            }`}
          >
            <Icon className="h-6 w-6" />
            {href === '/matches' && matchCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {matchCount}
              </span>
            )}
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

