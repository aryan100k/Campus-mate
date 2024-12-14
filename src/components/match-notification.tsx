import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/Profile'

interface MatchNotificationProps {
  profile: Profile
  onClose: () => void
}

export function MatchNotification({ profile, onClose }: MatchNotificationProps) {
  const router = useRouter()

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
              router.push(`/messages/${profile.id}`)
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