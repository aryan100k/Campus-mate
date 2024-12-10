'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { BottomNav } from '@/components/bottom-nav'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { PhotoUpload } from '@/components/photo-upload'

interface Profile {
  full_name: string
  age: string
  program: string
  bio: string
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
    photos: []
  })

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No user')

        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            profile_photos(*)
          `)
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile({
          full_name: data.full_name || '',
          age: data.age || '',
          program: data.program || '',
          bio: data.bio || '',
          photos: data.profile_photos || []
        })
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [])

  const handlePhotoUpload = async (file: File, index: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${index}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('profile_photos').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('profile_photos').getPublicUrl(fileName)

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

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          age: profile.age,
          program: profile.program,
          bio: profile.bio,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      const { error: photosError } = await supabase
        .from('profile_photos')
        .upsert(
          profile.photos.map(photo => ({
            profile_id: user.id,
            ...photo
          }))
        )

      if (photosError) throw photosError

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
          <Label htmlFor="photos" className="text-gray-700">Profile Photos</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <PhotoUpload
                key={index}
                url={profile.photos[index]?.url}
                onUpload={(file) => handlePhotoUpload(file, index)}
                isPrimary={index === 0}
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
      <BottomNav />
    </main>
  )
}