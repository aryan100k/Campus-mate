'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PhotoUpload } from '@/components/photo-upload'
import { motion } from 'framer-motion'
import { PhotoCarousel } from '@/components/photo-carousel'

interface Profile {
  full_name: string
  age: string
  program: string
  bio: string
  gender: string
  preferences: {
    gender_preference: string
  }
  photos: {
    url: string
    is_primary: boolean
    order_index: number
  }[]
}

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    age: '',
    program: '',
    bio: '',
    gender: '',
    preferences: {
      gender_preference: ''
    },
    photos: []
  })

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            age,
            program,
            bio,
            gender,
            preferences,
            photos,
            avatar_url
          `)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          return
        }

        if (data) {
          console.log('Fetched profile data:', data)
          setProfile({
            full_name: data.full_name || '',
            age: data.age?.toString() || '',
            program: data.program || '',
            bio: data.bio || '',
            gender: data.gender || '',
            preferences: data.preferences || { gender_preference: '' },
            photos: data.photos || []
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [router])

  const handlePhotoUpload = async (file: File, index: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${index}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName)

      const newPhotos = [...profile.photos]
      newPhotos[index] = {
        url: publicUrl,
        is_primary: index === 0,
        order_index: index
      }

      setProfile(prev => ({ ...prev, photos: newPhotos }))
    } catch (error) {
      console.error('Error uploading photo:', error)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const profileData = {
        id: user.id,
        full_name: profile.full_name,
        age: parseInt(profile.age),
        program: profile.program,
        bio: profile.bio,
        gender: profile.gender,
        preferences: profile.preferences,
        photos: profile.photos,
        avatar_url: profile.photos[0]?.url || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (error) throw error

      alert('Profile updated successfully!')
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      Loading...
    </div>
  }

  return (
    <main className="min-h-screen bg-gray-100 pb-16">
      <div className="container max-w-md mx-auto pt-4 px-4">
        <h1 className="text-2xl font-bold text-campus-pink mb-4">Your Profile</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Profile Preview</h2>
          <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-xl">
            {profile.photos.length > 0 ? (
              <>
                <PhotoCarousel 
                  photos={profile.photos} 
                  name={profile.full_name}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <h2 className="text-2xl font-bold">
                    {profile.full_name}, {profile.age}
                  </h2>
                  <p className="text-sm opacity-90">{profile.program}</p>
                  <p className="mt-2 line-clamp-3">{profile.bio}</p>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-gray-100">
                <p className="text-gray-500">Add photos to see your profile preview</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Edit Profile</h2>
          
          <div className="mb-8">
            <Label htmlFor="photos" className="text-gray-700">Profile Photos</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <PhotoUpload
                  key={index}
                  url={profile.photos[index]?.url}
                  onUpload={(file) => handlePhotoUpload(file, index)}
                  isPrimary={index === 0}
                  onRemove={profile.photos[index]?.url ? () => {
                    const newPhotos = [...profile.photos]
                    newPhotos.splice(index, 1)
                    setProfile(prev => ({ ...prev, photos: newPhotos }))
                  } : undefined}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="full_name">Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={profile.age}
                onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                className="mt-1"
                type="number"
              />
            </div>
            <div>
              <Label htmlFor="program">Program</Label>
              <Input
                id="program"
                value={profile.program}
                onChange={(e) => setProfile(prev => ({ ...prev, program: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-primary hover:bg-gradient-primary-hover text-white"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}