'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Photo {
  url: string
}

interface PhotoCarouselProps {
  photos: Photo[]
  name: string
}

export function PhotoCarousel({ photos, name }: PhotoCarouselProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1)
    }
  }

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1)
    }
  }

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          key={photos[currentPhotoIndex]?.url}
          src={photos[currentPhotoIndex]?.url || '/placeholder.svg'}
          alt={`${name}'s photo ${currentPhotoIndex + 1}`}
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      </AnimatePresence>

      <div className="absolute top-4 left-0 right-0 flex justify-center gap-1">
        {photos.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all ${
              index === currentPhotoIndex ? 'w-6 bg-white' : 'w-1 bg-white/50'
            }`}
          />
        ))}
      </div>

      {currentPhotoIndex > 0 && (
        <button
          onClick={prevPhoto}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      
      {currentPhotoIndex < photos.length - 1 && (
        <button
          onClick={nextPhoto}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
} 