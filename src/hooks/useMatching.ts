'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface MatchResult {
  isMatch: boolean
  matchId?: string
  error?: string
}

export function useMatching() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSwipe = async (targetUserId: string, isLike: boolean): Promise<MatchResult> => {
    if (!user) return { isMatch: false, error: 'No user found' }

    setLoading(true)
    try {
      // Skip if it's a pass
      if (!isLike) {
        return { isMatch: false }
      }

      // Record the swipe
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          liked_user_id: targetUserId,
          created_at: new Date().toISOString()
        })

      if (likeError) throw likeError

      // Check if it's a match
      const { data: matchData, error: matchCheckError } = await supabase
        .from('likes')
        .select()
        .eq('user_id', targetUserId)
        .eq('liked_user_id', user.id)
        .single()

      if (matchCheckError && matchCheckError.code !== 'PGRST116') {
        throw matchCheckError
      }

      if (matchData) {
        // Create a match
        const { data: newMatch, error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: user.id,
            user2_id: targetUserId,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (matchError) throw matchError

        return { 
          isMatch: true, 
          matchId: newMatch.id 
        }
      }

      return { isMatch: false }
    } catch (error) {
      console.error('Error handling swipe:', error)
      return { 
        isMatch: false, 
        error: 'Failed to process swipe' 
      }
    } finally {
      setLoading(false)
    }
  }

  return { handleSwipe, loading }
} 