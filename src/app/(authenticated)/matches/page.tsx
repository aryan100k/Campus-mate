'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../../lib/AuthContext'
import { supabase } from '../../../lib/supabase'
import { BottomNav } from '../../../components/bottom-nav'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '../../../components/ui/badge'

interface Match {
  id: string
  user1_id: string
  user2_id: string
  user1: {
    full_name: string
    photos: { url: string }[]
  }
  user2: {
    full_name: string
    photos: { url: string }[]
  }
  last_message?: {
    content: string
    created_at: string
  }
}

export default function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMatches()
    }
  }, [user])

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(
            full_name,
            photos(url)
          ),
          user2:profiles!matches_user2_id_fkey(
            full_name,
            photos(url)
          ),
          last_message:messages(
            content,
            created_at
          )
        `)
        .or(`user1_id.eq.${user?.id},user2_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMatches(data || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOtherUser = (match: Match) => {
    return match.user1_id === user?.id ? match.user2 : match.user1
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 pb-16">
        <div className="container max-w-md mx-auto pt-4 px-4">
          <h1 className="text-2xl font-bold text-isb-blue mb-4">Your Matches</h1>
          <p className="text-gray-600">Loading matches...</p>
        </div>
        <BottomNav />
      </main>
    )
  }

  if (matches.length === 0) {
    return (
      <main className="min-h-screen bg-gray-100 pb-16">
        <div className="container max-w-md mx-auto pt-4 px-4">
          <h1 className="text-2xl font-bold text-isb-blue mb-4">Your Matches</h1>
          <p className="text-gray-600">You don't have any matches yet. Keep swiping!</p>
        </div>
        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <div className="container max-w-md mx-auto pt-4 px-4">
        <h1 className="text-2xl font-bold text-isb-blue mb-4">Your Matches</h1>
        
        <div className="space-y-4">
          {matches.map((match) => {
            const otherUser = getOtherUser(match)
            return (
              <div
                key={match.id}
                onClick={() => {/* We'll add navigation to chat later */}}
                className="bg-white rounded-lg shadow p-4 flex items-center space-x-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <img
                    src={otherUser.photos?.[0]?.url || '/placeholder.svg'}
                    alt={otherUser.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{otherUser.full_name}</h3>
                  {match.last_message && (
                    <p className="text-gray-600 text-sm truncate">
                      {match.last_message.content}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <BottomNav />
    </main>
  )
}

