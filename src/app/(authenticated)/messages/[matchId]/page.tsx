'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Send, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { BottomNav } from '@/components/bottom-nav'

interface Message {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  created_at: string
}

interface Profile {
  id: string
  full_name: string
  avatar_url: string
  photos: {
    url: string
    is_primary: boolean
    order_index: number
  }[]
}

export default function ChatPage({ params }: { params: { matchId: string } }) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [chatRoomId, setChatRoomId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }
      setCurrentUser(session.user)
      setupChat(session.user)
    }
    
    checkAuth()
  }, [params.matchId])

  const setupChat = async (user: any) => {
    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey (id, full_name, avatar_url, photos),
          user2:profiles!matches_user2_id_fkey (id, full_name, avatar_url, photos)
        `)
        .eq('id', params.matchId)
        .single()

      if (matchError) throw matchError

      const otherUserProfile = match.user1.id === user.id ? match.user2 : match.user1
      setOtherUser(otherUserProfile)

      let { data: chatRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('match_id', params.matchId)
        .single()

      if (!chatRoom) {
        const { data: newChatRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({ match_id: params.matchId })
          .select('id')
          .single()

        if (createError) throw createError
        chatRoom = newChatRoom
      }

      setChatRoomId(chatRoom.id)

      const { data: existingMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', chatRoom.id)
        .order('created_at', { ascending: true })

      setMessages(existingMessages || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Error setting up chat:', error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Subscribe to new messages
    if (!chatRoomId) return

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      channel.unsubscribe()
    }
  }, [chatRoomId])

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoomId || !currentUser?.id) return
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: currentUser.id,
          content: newMessage.trim()
        })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b p-4 flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="font-semibold">{otherUser?.full_name || 'Chat'}</h1>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-20">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.sender_id === currentUser?.id
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              <p>{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border px-4 py-2 focus:outline-none focus:border-pink-500"
          />
          <Button
            onClick={sendMessage}
            className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
} 