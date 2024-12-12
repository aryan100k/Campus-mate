'use client'

import { supabase } from '@/lib/supabase'

interface SwipeResult {
  success: boolean
  matched?: boolean
  error?: string
  matchData?: {
    id: string
    user_name: string
    target_name: string
    user_photos: { url: string }[]
    target_photos: { url: string }[]
  }
}

export const useMatching = () => {
  const handleSwipe = async (targetProfileId: string, isLike: boolean): Promise<SwipeResult> => {
    try {
      console.log('handleSwipe started:', { targetProfileId, isLike })
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error in handleSwipe:', authError)
        throw new Error('Authentication required')
      }

      // First check for existing match in either direction
      const { data: existingMatches, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user_id.eq.${user.id},target_id.eq.${targetProfileId}),and(user_id.eq.${targetProfileId},target_id.eq.${user.id})`)

      if (matchError) {
        console.error('Error checking matches:', matchError)
        throw matchError
      }

      const ourMatch = existingMatches?.find(m => 
        m.user_id === user.id && m.target_id === targetProfileId
      )

      const theirMatch = existingMatches?.find(m => 
        m.user_id === targetProfileId && m.target_id === user.id
      )

      if (ourMatch) {
        // Update our existing match
        const { data: updatedMatch, error: updateError } = await supabase
          .from('matches')
          .update({ 
            liked: isLike,
            matched: isLike && theirMatch?.liked === true,
            updated_at: new Date().toISOString()
          })
          .eq('id', ourMatch.id)
          .select()
          .single()

        if (updateError) throw updateError

        // If they liked us and we just liked them, update their match too
        if (isLike && theirMatch?.liked) {
          await supabase
            .from('matches')
            .update({ 
              matched: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', theirMatch.id)
        }

        return {
          success: true,
          matched: isLike && theirMatch?.liked === true
        }
      }

      // Create new match if none exists
      const { data: newMatch, error: insertError } = await supabase
        .from('matches')
        .insert({
          user_id: user.id,
          target_id: targetProfileId,
          liked: isLike,
          matched: isLike && theirMatch?.liked === true
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating match:', insertError)
        throw insertError
      }

      // If they already liked us and we just liked them
      if (isLike && theirMatch?.liked) {
        await supabase
          .from('matches')
          .update({ 
            matched: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', theirMatch.id)
      }

      return {
        success: true,
        matched: isLike && theirMatch?.liked === true
      }

    } catch (error) {
      console.error('Error in handleSwipe:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  return { handleSwipe }
} 