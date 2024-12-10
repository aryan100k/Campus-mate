'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  profiles: {
    full_name: string
  }
}

interface ChatPageProps {
  params: {
    matchId: string
  }
}

interface MatchDetails {
  user1: {
    full_name: string
  }[]
  user2: {
    full_name: string
  }[]
}

export default function ChatPage({ params: { matchId } }: ChatPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [otherUser, setOtherUser] = useState<{ full_name: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMatchDetails()
    fetchMessages()
    const subscription = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, payload => {
        const newMessage = payload.new as Message
        setMessages(current => [...current, newMessage])
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [matchId])

  const fetchMatchDetails = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        user1:profiles!matches_user1_id_fkey(full_name),
        user2:profiles!matches_user2_id_fkey(full_name)
      `)
      .eq('id', matchId)
      .single()

    if (!error && data) {
      const other = data.user1[0].full_name === user?.email 
        ? data.user2[0] 
        : data.user1[0]
      setOtherUser({ full_name: other.full_name })
    }
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          full_name
        )
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content: newMessage.trim()
      })

    if (!error) {
      setNewMessage('')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      {/* Header - Updated styling */}
      <div className="bg-white shadow-sm border-b">
        <div className="container max-w-md mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-4 text-gray-600 hover:text-isb-blue transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {otherUser?.full_name || 'Chat'}
          </h1>
        </div>
      </div>

      {/* Messages - Updated styling */}
      <div className="container max-w-md mx-auto px-4 py-6">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  message.sender_id === user?.id
                    ? 'bg-isb-blue text-white'
                    : 'bg-white shadow-sm border border-gray-100 text-gray-900'
                }`}
              >
                <p className="text-[15px] leading-relaxed">{message.content}</p>
                <p className={`text-[11px] mt-1 ${
                  message.sender_id === user?.id
                    ? 'text-blue-100'
                    : 'text-gray-400'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Updated styling */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <form onSubmit={sendMessage} className="container max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-isb-blue/20 focus:border-isb-blue transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-5 py-2.5 bg-isb-blue text-white text-[15px] rounded-full font-medium hover:bg-isb-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}