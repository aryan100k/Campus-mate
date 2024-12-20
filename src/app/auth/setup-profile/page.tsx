'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PhotoUpload } from '@/components/photo-upload'

export default function SetupProfilePage() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [program, setProgram] = useState('')
  const [gender, setGender] = useState('')
  const [preference, setPreference] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handlePhotoUpload = (file: File, index: number) => {
    const newPhotos = [...photos]
    newPhotos[index] = file
    setPhotos(newPhotos)

    const reader = new FileReader()
    reader.onloadend = () => {
      const newPreviews = [...imagePreviews]
      newPreviews[index] = reader.result as string
      setImagePreviews(newPreviews)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate that at least one photo is uploaded
      if (photos.length === 0) {
        alert('Please upload at least one photo to continue')
        setIsSubmitting(false)
        return
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw userError || new Error('No user found')

      // Upload photos first
      const photoUrls = []
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        if (!file) continue

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`

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

        photoUrls.push({
          url: publicUrl,
          is_primary: i === 0,
          order_index: i
        })
      }

      // Validate that photos were actually uploaded
      if (photoUrls.length === 0) {
        alert('Please upload at least one photo to continue')
        setIsSubmitting(false)
        return
      }

      // Create profile with photo URLs
      const profileData = {
        id: user.id,
        full_name: name,
        age: parseInt(age),
        program,
        gender: gender === 'man' ? 'Man' : 'Woman',
        preferences: {
          gender_preference: preference === 'men' ? 'Man' : 'Woman'
        },
        photos: photoUrls,
        avatar_url: photoUrls[0]?.url || null,
        updated_at: new Date().toISOString()
      }

      console.log('Saving profile data:', profileData)

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData)

      if (profileError) {
        console.error('Profile Error:', profileError)
        throw profileError
      }

      router.push('/discover')
    } catch (error) {
      console.error('Error:', error)
      alert('Error setting up profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Set Up Your Profile</h1>
        
        <div className="bg-white rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Full Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label>Program</Label>
              <Input
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label>I am a</Label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                required
                className="mt-2"
              >
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="man" id="man" />
                    <Label htmlFor="man">Man</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="woman" id="woman" />
                    <Label htmlFor="woman">Woman</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Show me</Label>
              <RadioGroup
                value={preference}
                onValueChange={setPreference}
                required
                className="mt-2"
              >
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="men" id="show-men" />
                    <Label htmlFor="show-men">Men</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="women" id="show-women" />
                    <Label htmlFor="show-women">Women</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Profile Photos</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <PhotoUpload
                    key={index}
                    url={imagePreviews[index]}
                    onUpload={(file) => handlePhotoUpload(file, index)}
                    isPrimary={index === 0}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-full transition duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting up...' : 'Complete Profile'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

