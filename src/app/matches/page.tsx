'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BottomNav } from '@/components/bottom-nav'

// Define the database profile structure
interface DatabaseProfile {
  id: string
  full_name: string
  avatar_url?: string
  photos: { url: string }[]
}

// Define the database match structure
interface DatabaseMatch {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  user1: DatabaseProfile | DatabaseProfile[]
  user2: DatabaseProfile | DatabaseProfile[]
}

// Define the transformed profile structure
interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  photos: { url: string }[]
}

// Define the transformed match structure
interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  other_user: Profile
}

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      console.log('=== Match Fetch Process Starting ===')
      console.log('Auth state:', { user, authLoading })
      
      if (authLoading) {
        console.log('⏳ Auth still loading...')
        return
      }

      if (!user?.id) {
        console.log('❌ No user ID available')
        setLoading(false)
        return
      }

      try {
        console.log('🔍 Fetching matches for user:', user.id)
        
        // First, let's verify the user ID with a simple query
        const { data: userCheck, error: userError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', user.id)
          .single()

        console.log('User check result:', userCheck)

        if (userError) {
          console.error('User check error:', userError)
          return
        }

        // Now fetch matches
        const { data: rawData, error } = await supabase
          .from('matches')
          .select(`
            id,
            user1_id,
            user2_id,
            created_at,
            user1:profiles!matches_user1_id_fkey (
              id,
              full_name,
              avatar_url,
              photos
            ),
            user2:profiles!matches_user2_id_fkey (
              id,
              full_name,
              avatar_url,
              photos
            )
          `)
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

        console.log('📦 Raw matches data:', rawData)

        if (error) {
          console.error('❌ Supabase error:', error)
          throw error
        }

        if (!rawData || rawData.length === 0) {
          console.log('ℹ️ No matches found')
          setMatches([])
          setLoading(false)
          return
        }

        const transformedMatches = rawData.map((match: DatabaseMatch) => {
          const isUser1 = match.user1_id === user.id
          const otherUserData = isUser1 ? match.user2 : match.user1
          const otherUser = Array.isArray(otherUserData) 
            ? otherUserData[0] 
            : otherUserData as DatabaseProfile

          console.log('Processing match:', {
            matchId: match.id,
            isUser1,
            otherUser: {
              id: otherUser.id,
              name: otherUser.full_name
            }
          })

          return {
            id: match.id,
            user1_id: match.user1_id,
            user2_id: match.user2_id,
            created_at: match.created_at,
            other_user: {
              id: otherUser.id,
              full_name: otherUser.full_name,
              avatar_url: otherUser.avatar_url,
              photos: otherUser.photos || []
            }
          }
        })

        console.log('🎉 Final transformed matches:', transformedMatches)
        setMatches(transformedMatches)
      } catch (error) {
        console.error('❌ Error in fetchMatches:', error)
      } finally {
        console.log('=== Match Fetch Process Complete ===')
        setLoading(false)
      }
    }

    if (!authLoading && user?.id) {
      fetchMatches()
    }
  }, [user, user?.id, authLoading])

  // Add this console log to track renders
  console.log('Rendering MatchesPage:', { 
    authLoading, 
    loading, 
    userId: user?.id,
    matchesCount: matches.length 
  })

  // Show loading state while auth is loading
  if (authLoading || (loading && user?.id)) {
    return (
      <main className="min-h-screen bg-gray-100 pb-16">
        <div className="container max-w-md mx-auto pt-4 px-4">
          <h1 className="text-2xl font-bold text-isb-blue mb-4">Matches</h1>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-4 shadow-sm">
                <div className="aspect-square rounded-xl bg-gray-200 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </main>
    )
  }

  // Show matches or no matches message
  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <div className="container max-w-md mx-auto pt-4 px-4">
        <h1 className="text-2xl font-bold text-isb-blue mb-4">Matches</h1>
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No matches yet</p>
            <p className="text-sm text-gray-400">
              Keep swiping to find your match!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {matches.map(match => (
              <div
                key={match.id}
                onClick={() => router.push(`/messages/${match.id}`)}
                className="cursor-pointer bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3">
                  <img
                    src={match.other_user.photos?.[0]?.url || match.other_user.avatar_url}
                    alt={match.other_user.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-gray-900">
                  {match.other_user.full_name}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  )
}

