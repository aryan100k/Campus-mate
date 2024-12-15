'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { BottomNav } from '@/components/bottom-nav'
import { useMatching } from '@/hooks/useMatching'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { PhotoCarousel } from '@/components/photo-carousel'
import { MatchNotification } from '@/components/match-notification'

interface Profile {
  id: string
  full_name: string
  program: string
  bio: string
  photos: { url: string }[]
  age: number
  gender: string
  preferences: {
    gender_preference: string
  }
}

console.log('DiscoverPage module loaded')

export default function DiscoverPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { handleSwipe } = useMatching()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMatch, setShowMatch] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Define fetchProfiles function first
  const fetchProfiles = async (userId: string) => {
    try {
      console.log('Starting fetchProfiles for user:', userId)
      
      // Get user's profile
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user profile:', userError)
        return
      }

      // First get all likes/dislikes by the user
      const { data: interactions } = await supabase
        .from('likes')
        .select('liked_user_id')
        .eq('user_id', userId)

      // Create array of already interacted profile IDs
      const interactedIds = interactions?.map(like => like.liked_user_id) || []
      console.log('Already interacted with profiles:', interactedIds)

      // Get profiles excluding already interacted ones
      const { data: potentialMatches, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .not('id', 'in', `(${interactedIds.length ? interactedIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .eq('gender', userProfile.gender === 'Man' ? 'Woman' : 'Man')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      // Filter valid profiles
      const validProfiles = potentialMatches?.filter(profile => 
        profile.photos && 
        profile.photos.length > 0 && 
        profile.full_name &&
        profile.age
      ) || []

      console.log('Valid profiles found:', validProfiles.length)
      setProfiles(validProfiles)
      setLoading(false)

    } catch (error) {
      console.error('Error in fetchProfiles:', error)
      setLoading(false)
    }
  }

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
        await fetchProfiles(session.user.id)
      }
    }
    
    checkAuth()
  }, [router])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profiles...</p>
      </div>
    )
  }

  // No profiles state
  if (!loading && (!profiles.length || currentIndex >= profiles.length)) {
    return (
      <main className="min-h-screen bg-gray-100 pb-16">
        <div className="container max-w-md mx-auto pt-4 px-4">
          <h1 className="text-2xl font-bold text-isb-blue mb-4">Discover</h1>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No More Profiles</h2>
            <p className="text-gray-600 mb-4">Check back later for new matches!</p>
            <Button 
              onClick={() => user?.id && fetchProfiles(user.id)}
              className="bg-isb-blue text-black hover:bg-isb-blue/90"
            >
              Refresh Profiles
            </Button>
          </div>
        </div>
        <BottomNav />
      </main>
    )
  }

  const currentProfile = profiles[currentIndex]

  // Add swipe animation functionality
  const swipe = async (dir: string) => {
    if (!userId) {
      console.error('No user ID available, current userId:', userId)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.id) {
        setUserId(session.user.id)
      } else {
        console.error('Could not get user ID even after refresh')
        return
      }
    }

    if (!profiles[currentIndex]) {
      console.error('No current profile available')
      return
    }

    const currentProfile = profiles[currentIndex]
    console.log('Processing swipe:', { 
      direction: dir, 
      currentProfileId: currentProfile.id,
      userId: userId 
    })

    try {
      setDirection(dir)
      const isLike = dir === 'right' || dir === 'super'
      const isSuperLike = dir === 'super'

      const result = await handleSwipe(currentProfile.id, isLike, isSuperLike)
      console.log('Swipe result:', result)

      if (result.success && result.matched) {
        setShowMatch(true)
        if (window.navigator?.vibrate) {
          window.navigator.vibrate([100, 50, 100])
        }
      }

      setTimeout(() => {
        setDirection(null)
        setCurrentIndex(prev => prev + 1)
      }, 300)

    } catch (error) {
      console.error('Swipe error:', error)
      setDirection(null)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <div className="container max-w-md mx-auto pt-4 px-4">
        <h1 className="text-2xl font-bold text-isb-blue mb-4">Discover</h1>

        <div className="relative h-[600px] w-full">
          <AnimatePresence>
            {currentProfile && (
              <motion.div
                key={currentProfile.id}
                className="profile-card absolute w-full h-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: direction === 'right' ? 300 : direction === 'left' ? -300 : 0,
                  rotate: direction === 'right' ? 20 : direction === 'left' ? -20 : 0,
                }}
                exit={{ 
                  x: direction === 'right' ? 1000 : -1000,
                  opacity: 0,
                  scale: 0.8,
                  transition: { duration: 0.5 }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipeThreshold = 100;
                  if (offset.x < -swipeThreshold) {
                    swipe('left');
                  } else if (offset.x > swipeThreshold) {
                    swipe('right');
                  }
                }}
              >
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl">
                  <PhotoCarousel 
                    photos={currentProfile.photos || []} 
                    name={currentProfile.full_name} 
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                    <h2 className="text-2xl font-bold">
                      {currentProfile.full_name}, {currentProfile.age}
                    </h2>
                    <p className="text-sm opacity-90">{currentProfile.program}</p>
                    <p className="mt-2 line-clamp-3">{currentProfile.bio}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={() => swipe('left')}
            size="icon"
            className="h-14 w-14 rounded-full bg-white border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            onClick={() => swipe('super')}
            size="icon"
            className="h-14 w-14 rounded-full bg-white border-2 border-isb-gold text-isb-gold hover:bg-isb-gold hover:text-white"
          >
            <Star className="h-6 w-6" />
          </Button>
          <Button
            onClick={() => swipe('right')}
            size="icon"
            className="h-14 w-14 rounded-full bg-white border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>
      </div>
      <BottomNav />
      <AnimatePresence>
        {showMatch && currentProfile && (
          <MatchNotification 
            profile={currentProfile} 
            onClose={() => setShowMatch(false)} 
          />
        )}
      </AnimatePresence>
    </main>
  )
}
