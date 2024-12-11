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
      console.log('handleSwipe called:', { targetProfileId, isLike })
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('Auth error:', authError)
        throw new Error('Authentication required')
      }

      console.log('Current user:', user.id)

      // First check if there's already a match record
      const { data: existingMatch, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          user:profiles!matches_user_id_fkey (
            full_name,
            photos
          ),
          target:profiles!matches_target_id_fkey (
            full_name,
            photos
          )
        `)
        .or(`and(user_id.eq.${user.id},target_id.eq.${targetProfileId}),and(user_id.eq.${targetProfileId},target_id.eq.${user.id})`)
        .single()

      console.log('Existing match check:', { existingMatch, matchError })

      if (existingMatch) {
        console.log('Updating existing match')
        // Update existing match
        const { data: updatedMatch, error: updateError } = await supabase
          .from('matches')
          .update({
            liked: isLike,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMatch.id)
          .select(`
            *,
            user:profiles!matches_user_id_fkey (
              full_name,
              photos
            ),
            target:profiles!matches_target_id_fkey (
              full_name,
              photos
            )
          `)
          .single()

        if (updateError) throw updateError

        // Check if it's a match after update
        const { data: matchStatus } = await supabase
          .from('matches')
          .select('matched')
          .eq('id', existingMatch.id)
          .single()

        return {
          success: true,
          matched: matchStatus?.matched || false,
          matchData: matchStatus?.matched ? {
            id: updatedMatch.id,
            user_name: updatedMatch.user.full_name,
            target_name: updatedMatch.target.full_name,
            user_photos: updatedMatch.user.photos,
            target_photos: updatedMatch.target.photos
          } : undefined
        }
      } else {
        console.log('Creating new match')
        // Create new match
        const { data: newMatch, error: insertError } = await supabase
          .from('matches')
          .insert({
            user_id: user.id,
            target_id: targetProfileId,
            liked: isLike,
            matched: false
          })
          .select(`
            *,
            user:profiles!matches_user_id_fkey (
              full_name,
              photos
            ),
            target:profiles!matches_target_id_fkey (
              full_name,
              photos
            )
          `)
          .single()

        if (insertError) throw insertError

        return {
          success: true,
          matched: false
        }
      }
    } catch (error) {
      console.error('Detailed error in handleSwipe:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  return { handleSwipe }
} 