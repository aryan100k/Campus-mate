'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

export const useMatching = () => {
  const { user } = useAuth()
  const currentUserId = user?.id

  const handleSwipe = async (targetId: string, isLike: boolean, isSuperLike: boolean) => {
    try {
      if (!currentUserId) {
        console.error('No current user ID')
        return { success: false }
      }

      console.log('Starting swipe action:', { currentUserId, targetId, isLike, isSuperLike })

      // Record the like/dislike
      const { data: interaction, error: interactionError } = await supabase
        .from('likes')
        .insert({
          user_id: currentUserId,
          liked_user_id: targetId,
          is_like: isLike,
          is_super_like: isSuperLike
        })
        .select()
        .single()

      if (interactionError) {
        console.error('Error recording interaction:', interactionError)
        return { success: false }
      }

      // Check for mutual like
      if (isLike) {
        const { data: mutualLike } = await supabase
          .from('likes')
          .select('*')
          .eq('user_id', targetId)
          .eq('liked_user_id', currentUserId)
          .eq('is_like', true)
          .single()

        if (mutualLike) {
          console.log('Mutual like found! Creating match...')
          
          // Create match
          const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: currentUserId,
              user2_id: targetId,
              status: 'active'
            })
            .select()
            .single()

          if (matchError) {
            console.error('Error creating match:', matchError)
            return { success: false }
          }

          // Create chat room
          const { error: chatRoomError } = await supabase
            .from('chat_rooms')
            .insert({
              match_id: match.id
            })

          if (chatRoomError) {
            console.error('Error creating chat room:', chatRoomError)
            return { success: false }
          }

          console.log('Match and chat room created successfully!')
          return { success: true, matched: true }
        }
      }

      return { success: true, matched: false }
    } catch (error) {
      console.error('Error in handleSwipe:', error)
      return { success: false }
    }
  }

  return { handleSwipe }
} 