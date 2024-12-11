'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { BottomNav } from '@/components/bottom-nav'
import { useMatching } from '@/hooks/useMatching'
import { createClient } from '@supabase/supabase-js'
import { useAuth, AuthContextType } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase'
import { PhotoCarousel } from '@/components/photo-carousel'

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
  const { user, profile } = useAuth() as AuthContextType
  const { handleSwipe } = useMatching()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMatch, setShowMatch] = useState(false)

  console.log('Component mounted, auth state:', { user, profile })

  useEffect(() => {
    const initializeProfiles = async () => {
      console.log('useEffect triggered, checking auth...')
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth error:', error)
        return
      }

      if (session?.user?.id) {
        console.log('User authenticated:', session.user.id)
        await fetchProfiles(session.user.id)
      } else {
        console.log('No authenticated user found')
        router.push('/login')
      }
    }

    initializeProfiles()
  }, [router])

  useEffect(() => {
    console.log('Auth state changed:', { 
      hasUser: Boolean(user), 
      userId: user?.id,
      hasProfile: Boolean(profile)
    })

    if (user?.id && !profiles.length) {
      console.log('User authenticated, fetching profiles')
      fetchProfiles(user.id)
    }
  }, [user, profile])

  const fetchProfiles = async (userId: string) => {
    try {
      setLoading(true)
      console.log('Starting fetchProfiles for user:', userId)

      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', userId)
        .single()

      if (userError || !userProfile?.gender) {
        console.error('Error fetching user profile:', userError)
        return
      }

      const oppositeGender = userProfile.gender === 'male' ? 'female' : 'male'
      console.log('Looking for profiles with gender:', oppositeGender)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .eq('gender', oppositeGender)

      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      console.log('Fetched profiles:', data?.length)
      if (data?.length) {
        const validProfiles = data.filter(profile => 
          profile.photos && 
          profile.photos.length > 0 && 
          profile.full_name &&
          profile.age
        )
        console.log('Valid profiles:', validProfiles.length)
        setProfiles(validProfiles)
        setCurrentIndex(0)
      }
    } catch (error) {
      console.error('Error in fetchProfiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentProfile = profiles[currentIndex]

  const swipe = async (dir: string) => {
    // First check if we have a user and profile
    if (!user?.id) {
      console.log('No user found, redirecting to login')
      router.push('/login')
      return
    }

    if (!currentProfile) {
      console.log('No profile to swipe on')
      return
    }

    console.log('Starting swipe:', {
      direction: dir,
      userId: user.id,
      targetProfileId: currentProfile.id
    })

    try {
      setDirection(dir)
      const isLike = dir === 'right' || dir === 'super'
      
      // Call handleSwipe from useMatching hook
      const result = await handleSwipe(currentProfile.id, isLike)
      
      console.log('Swipe result:', result)

      // Add haptic feedback for mobile
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50)
      }

      // Show match notification if it's a match
      if (result.success && result.matched) {
        setShowMatch(true)
      }

      // Move to next profile after animation
      setTimeout(() => {
        setDirection(null)
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1
          if (nextIndex >= profiles.length) {
            // If we've reached the end, fetch new profiles
            if (user?.id) {
              fetchProfiles(user.id)
            }
            return 0
          }
          return nextIndex
        })
      }, 300)

    } catch (error) {
      console.error('Error processing swipe:', error)
      setDirection(null)
    }
  }

  const checkExistingMatch = async (profileId: string) => {
    if (!user?.id) return null
    
    const { data } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user_id.eq.${user.id},target_id.eq.${profileId}),and(user_id.eq.${profileId},target_id.eq.${user.id})`)
      .single()
    
    return data
  }

  const MatchNotification = ({ profile, onClose }: { profile: Profile, onClose: () => void }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 p-4"
      >
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-4">It's a Match! 🎉</h2>
          <p className="text-gray-600 mb-6">
            You and {profile.full_name} liked each other
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => {
                router.push('/messages')
                onClose()
              }}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500"
            >
              Send Message
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Keep Swiping
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading matches...</p>
      </div>
    )
  }

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
              className="bg-isb-blue text-white hover:bg-isb-blue/90"
            >
              Refresh Profiles
            </Button>
          </div>
        </div>
        <BottomNav />
      </main>
    )
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
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: direction === 'right' ? 300 : direction === 'left' ? -300 : 0,
                  rotate: direction === 'right' ? 20 : direction === 'left' ? -20 : 0,
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute w-full h-full"
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
            disabled={!currentProfile || !user}
          >
            <X className="h-6 w-6" />
          </Button>
          <Button
            onClick={() => swipe('super')}
            size="icon"
            className="h-14 w-14 rounded-full bg-white border-2 border-isb-gold text-isb-gold hover:bg-isb-gold hover:text-white"
            disabled={!currentProfile || !user}
          >
            <Star className="h-6 w-6" />
          </Button>
          <Button
            onClick={() => swipe('right')}
            size="icon"
            className="h-14 w-14 rounded-full bg-white border-2 border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            disabled={!currentProfile || !user}
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
