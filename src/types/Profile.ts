export interface Profile {
  id: string
  full_name: string
  email?: string | null
  program: string
  bio?: string | null
  photos: { url: string }[]
  preferences?: any
  created_at?: string
  avatar_url?: string | null
}
