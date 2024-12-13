'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

export const useMatching = () => {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSwipe = async (targetId: string, isLike: boolean, isSuperLike: boolean = false) => {
    // Get current session to ensure we have latest user data
    const { data: { session } } = await supabase.auth.getSession()
    const currentUserId = session?.user?.id

    console.log('handleSwipe details:', {
      targetId,
      isLike,
      isSuperLike,
      currentUserId,
      isProcessing
    })
    
    if (!currentUserId || isProcessing) {
      console.error('Invalid swipe state:', { currentUserId, isProcessing })
      return { success: false }
    }
    
    setIsProcessing(true)
    
    try {
      console.log('Recording swipe action...')
      // Record the swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          user_id: currentUserId,
          target_id: targetId,
          action: isLike ? 'like' : 'dislike'
        })

      if (swipeError) {
        console.error('Swipe recording error:', swipeError)
        throw swipeError
      }

      if (!isLike) {
        console.log('Dislike recorded successfully')
        return { success: true, matched: false }
      }

      console.log('Checking for mutual like...')
      // Check if target has already liked the user
      const { data: existingLike, error: likeError } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', targetId)
        .eq('target_id', currentUserId)
        .eq('action', 'like')
        .single()

      if (likeError && likeError.code !== 'PGRST116') { // Ignore not found error
        console.error('Error checking existing like:', likeError)
        throw likeError
      }

      console.log('Existing like found:', existingLike)

      // If there's a match, create it
      if (existingLike) {
        console.log('Creating new match...')
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: currentUserId,
            user2_id: targetId
          })
          .select()
          .single()

        if (matchError) {
          console.error('Match creation error:', matchError)
          throw matchError
        }

        console.log('Creating chat room...')
        // Create a chat room for the match
        const { data: chatRoom, error: chatError } = await supabase
          .from('chat_rooms')
          .insert({
            match_id: match.id
          })
          .select()
          .single()

        if (chatError) {
          console.error('Chat room creation error:', chatError)
          throw chatError
        }

        console.log('Match and chat room created successfully')
        return {
          success: true,
          matched: true,
          matchData: {
            matchId: match.id,
            chatRoomId: chatRoom.id,
            targetId
          }
        }
      }

      console.log('Like recorded successfully (no match yet)')
      return { success: true, matched: false }

    } catch (error) {
      console.error('Error in handleSwipe:', error)
      return { success: false, error }
    } finally {
      setIsProcessing(false)
    }
  }

  return { handleSwipe, isProcessing }
} 