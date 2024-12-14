'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { BottomNav } from '@/components/bottom-nav'
import { useRouter } from 'next/navigation'
import { Link } from 'lucide-react'

// Define the base Profile type
interface Profile {
  id: string
  full_name: string
  avatar_url?: string
  photos: { url: string; is_primary: boolean; order_index: number }[]
}

// Define the raw data structure from Supabase
interface RawMatch {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  user1: Profile
  user2: Profile
}

// Define the processed match type
interface Match {
  id: string
  user1_id: string
  user2_id: string
  user1: Profile
  user2: Profile
  other_user: Profile
}

// Define the chat room type
interface ChatRoom {
  id: string
  match_id: string
  created_at: string
  match: Match
}

export default function MessagesPage() {
  const router = useRouter()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session:', session)
      
      if (!session) {
        console.log('No session found, redirecting to login...')
        router.push('/login')
        return
      }

      if (session?.user?.id) {
        console.log('Setting user ID:', session.user.id)
        setUserId(session.user.id)
        fetchChatRooms(session.user.id)
      }
    }
    
    checkAuth()
  }, [])

  const fetchChatRooms = async (currentUserId: string) => {
    try {
      console.log('Fetching chat rooms for user:', currentUserId)

      // Debug: Direct database checks
      const { data: likesCheck, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', currentUserId)
      console.log('Debug - User likes:', { likesCheck, likesError })

      const { data: matchesCheck, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
          created_at
        `)
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      console.log('Debug - Direct matches check:', { matchesCheck, matchesError })

      // Original matches query with profiles
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          status,
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
        .eq('status', 'active')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)

      console.log('Debug - Full matches query result:', { matches, matchError })

      if (matchError) {
        console.error('Error fetching matches:', matchError)
        return
      }

      if (!matches || matches.length === 0) {
        console.log('No matches found')
        setChatRooms([])
        setLoading(false)
        return
      }

      const typedMatches = matches as unknown as RawMatch[]

      // Log each match for debugging
      typedMatches.forEach((match, index) => {
        console.log(`Match ${index + 1}:`, {
          matchId: match.id,
          user1: match.user1.full_name,
          user2: match.user2.full_name,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          created_at: match.created_at
        })
      })

      const { data: rooms, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .in('match_id', typedMatches.map(m => m.id))

      console.log('Chat rooms found:', rooms)

      if (roomError) {
        console.error('Error fetching chat rooms:', roomError)
        return
      }

      const processedRooms = typedMatches
        .map(match => {
          const room = rooms?.find(r => r.match_id === match.id)
          if (!room) return null

          const otherUser = match.user1_id === currentUserId ? match.user2 : match.user1

          return {
            id: room.id,
            match_id: room.match_id,
            created_at: room.created_at,
            match: {
              id: match.id,
              user1_id: match.user1_id,
              user2_id: match.user2_id,
              user1: match.user1,
              user2: match.user2,
              other_user: otherUser
            }
          } as ChatRoom
        })
        .filter((room): room is ChatRoom => room !== null)

      console.log('Final processed chatRooms:', processedRooms)
      setChatRooms(processedRooms)
    } catch (error) {
      console.error('Error in fetchChatRooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getOtherUser = (match: Match, currentUserId: string | null): Profile | null => {
    if (!currentUserId) return null
    return match.user1_id === currentUserId ? match.user2 : match.user1
  }

  const navigateToChat = (matchId: string) => {
    if (!matchId) {
      console.error('No match ID provided')
      return
    }
    router.push(`/messages/${matchId}`)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container max-w-md mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="h-12 bg-gray-200 rounded-full w-12 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </main>
    )
  }

  console.log('ChatRooms before render:', chatRooms)

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <div className="container max-w-md mx-auto pt-4 px-4">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        {chatRooms?.map(room => {
          const otherUser = getOtherUser(room.match, userId)
          if (!otherUser) return null
          
          return (
            <div key={room.id} onClick={() => navigateToChat(room.match.id)}>
              <Link
                href={`/messages/${room.match_id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {otherUser.avatar_url && (
                        <img
                          src={otherUser.avatar_url}
                          alt={otherUser.full_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {otherUser.full_name}
                    </p>
                    <p className="text-sm text-gray-400">
                      New match! Say hello 👋
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </main>
  )
}