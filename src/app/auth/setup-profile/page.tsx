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

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profiles')
          .getPublicUrl(fileName)

        photoUrls.push({
          url: publicUrl,
          is_primary: i === 0,
          order_index: i
        })

        console.log('Successfully uploaded photo:', publicUrl)
      }

      // Create profile with photo URLs
      const profileData = {
        id: user.id,
        full_name: name,
        age: parseInt(age),
        program,
        gender,
        preferences: { gender_preference: preference },
        photos: photoUrls,
        avatar_url: photoUrls[0]?.url || null,
        updated_at: new Date().toISOString()
      }

      console.log('Saving profile data:', profileData)

      // First try to update
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile Error:', profileError)
        // If update fails, try insert
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData)
        
        if (insertError) throw insertError
      }

      // Success! Redirect to discover page
      router.push('/discover')

    } catch (error) {
      console.error('Detailed Error:', error)
      alert('Error setting up profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 p-8">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-3xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pink-600">Campus Mate</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-600">Set Up Your Profile</h2>
          <p className="mt-2 text-sm text-gray-500">Let's get to know you better</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Label htmlFor="name" className="text-gray-700">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 rounded-full"
              />
            </div>
            <div>
              <Label htmlFor="age" className="text-gray-700">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 rounded-full"
              />
            </div>
            <div>
              <Label htmlFor="program" className="text-gray-700">Program at ISB</Label>
              <RadioGroup defaultValue="ivi" onValueChange={setProgram} className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <RadioGroupItem value="ivi" id="ivi" className="peer sr-only" />
                  <Label
                    htmlFor="ivi"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>ivi</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pgp" id="pgp" className="peer sr-only" />
                  <Label
                    htmlFor="pgp"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>PGP</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="mfab" id="mfab" className="peer sr-only" />
                  <Label
                    htmlFor="mfab"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>MFAB</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pgpmax" id="pgpmax" className="peer sr-only" />
                  <Label
                    htmlFor="pgpmax"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>PGPMax</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="gender" className="text-gray-700">I am a</Label>
              <RadioGroup defaultValue="male" onValueChange={setGender} className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <RadioGroupItem value="male" id="male" className="peer sr-only" />
                  <Label
                    htmlFor="male"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>Man</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="female" id="female" className="peer sr-only" />
                  <Label
                    htmlFor="female"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>Woman</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="preference" className="text-gray-700">Show me</Label>
              <RadioGroup defaultValue="women" onValueChange={setPreference} className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <RadioGroupItem value="men" id="show-men" className="peer sr-only" />
                  <Label
                    htmlFor="show-men"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>Men</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="women" id="show-women" className="peer sr-only" />
                  <Label
                    htmlFor="show-women"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span>Women</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="photos" className="text-gray-700">Profile Photos</Label>
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
          </div>

          <div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-full transition duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting up...' : 'Complete Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

