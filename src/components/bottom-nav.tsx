'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, MessageCircle, User } from 'lucide-react'

const navItems = [
  { href: '/discover', icon: Home, label: 'Discover' },
  { href: '/matches', icon: Heart, label: 'Matches' },
  { href: '/messages', icon: MessageCircle, label: 'Messages' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-3xl shadow-lg">
      <div className="flex justify-around">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center p-2 ${
              pathname === href ? 'text-pink-600' : 'text-gray-500'
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

