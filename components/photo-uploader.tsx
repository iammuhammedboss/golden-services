import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from './ui/button'
import { Image as ImageIcon, Trash2 } from 'lucide-react'

interface CloudinaryUploadWidgetResult {
  event: 'success'
  info: {
    secure_url: string
    thumbnail_url: string
    public_id: string
  }
}

interface PhotoUploaderProps {
  onUpload: (url: string) => void
  onRemove: (url: string) => void
  uploadedUrls: string[]
}

// Declare the cloudinary global variable
declare global {
  interface Window {
    cloudinary: any
  }
}

export function PhotoUploader({ onUpload, onRemove, uploadedUrls }: PhotoUploaderProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.cloudinary) {
      const script = document.createElement('script')
      script.src = 'https://upload-widget.cloudinary.com/global/all.js'
      script.async = true
      script.onload = () => setIsScriptLoaded(true)
      document.body.appendChild(script)
    } else {
      setIsScriptLoaded(true)
    }
  }, [])

  const openWidget = () => {
    if (!isScriptLoaded || !window.cloudinary) {
      console.error('Cloudinary script not loaded')
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, // Ensure this is in your .env.local
        uploadSignature: async (callback: any, params_to_sign: any) => {
          const response = await fetch('/api/upload-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paramsToSign: params_to_sign }),
          })
          const { signature } = await response.json()
          callback(signature)
        },
        cropping: true,
        multiple: true,
        maxFiles: 10,
        folder: 'site_visits', // Optional: organize uploads in Cloudinary
      },
      (error: any, result: CloudinaryUploadWidgetResult) => {
        if (error) {
          console.error('Upload widget error:', error)
          return
        }
        if (result.event === 'success') {
          onUpload(result.info.secure_url)
        }
      }
    )
    widget.open()
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="outline" onClick={openWidget} disabled={!isScriptLoaded}>
        <ImageIcon className="mr-2 h-4 w-4" />
        Upload Photos
      </Button>
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {uploadedUrls.map((url) => (
            <div key={url} className="relative group">
              <Image
                src={url.replace('/upload/', '/upload/w_150,h_150,c_fill/')}
                alt="Uploaded image"
                width={150}
                height={150}
                className="rounded-md object-cover w-full h-full"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(url)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
