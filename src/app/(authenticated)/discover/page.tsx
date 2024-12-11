'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Star } from 'lucide-react'
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

export default function DiscoverPage() {
  const { user, profile } = useAuth() as AuthContextType
  const { handleSwipe } = useMatching()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchProfiles(user.id)
    }
  }, [user?.id])

  const fetchProfiles = async (userId: string) => {
    try {
      console.log('Starting fetchProfiles for user:', userId)

      // First get current user's gender
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', userId)
        .single()

      if (userError) {
        console.error('Error fetching user gender:', userError)
        return
      }

      // Determine which gender to show
      const oppositeGender = userProfile.gender === 'male' ? 'female' : 'male'
      console.log('User gender:', userProfile.gender)
      console.log('Looking for:', oppositeGender)

      // Get profiles of opposite gender
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          program,
          bio,
          age,
          gender,
          photos,
          preferences
        `)
        .neq('id', userId)
        .eq('gender', oppositeGender)

      if (error) {
        console.error('Error fetching profiles:', error)
        throw error
      }

      console.log('Filtered profiles:', data)

      if (data && data.length > 0) {
        setProfiles(data)
        setCurrentIndex(0)
      } else {
        console.log('No profiles found after filtering')
      }

    } catch (error) {
      console.error('Error in fetchProfiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentProfile = profiles[currentIndex]

  const swipe = async (dir: string) => {
    if (!currentProfile || !user?.id) return

    setDirection(dir)
    
    const isLike = dir === 'right' || dir === 'super'
    await handleSwipe(currentProfile.id, isLike)

    setTimeout(() => {
      setDirection(null)
      setCurrentIndex((prev) => {
        if (prev === profiles.length - 1) {
          fetchProfiles(user.id)
          return 0
        }
        return prev + 1
      })
    }, 300)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading potential matches...</p>
      </div>
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
    </main>
  )
}