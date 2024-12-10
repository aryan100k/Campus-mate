'use client'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

interface PhotoUploadProps {
  url?: string
  onUpload: (file: File) => void
  isPrimary?: boolean
  onRemove?: () => void
}

export function PhotoUpload({ url, onUpload, isPrimary, onRemove }: PhotoUploadProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <div className="relative aspect-square">
      <label
        className={`
          block w-full h-full rounded-lg border-2 border-dashed
          ${url ? 'border-transparent' : 'border-gray-300'}
          hover:border-gray-400 transition-colors cursor-pointer
          overflow-hidden
        `}
      >
        {url ? (
          <>
            <img
              src={url}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
            {isPrimary && (
              <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                Primary
              </span>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="mt-2 text-xs text-gray-500">
              {isPrimary ? 'Add primary photo' : 'Add photo'}
            </span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </label>

      {url && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
} 