'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const inspirationalQuotes = [
  "Excellence is not a skill, it's an attitude.",
  "Quality is never an accident; it is always the result of intelligent effort.",
  "We don't just clean, we care.",
  "Your satisfaction is our commitment.",
  "Professional service, personal touch.",
  "Where cleanliness meets excellence.",
  "Building trust, one service at a time.",
  "Your space, our pride.",
  "Dedication to perfection in every detail.",
  "Service with a smile, quality with a guarantee.",
]

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  const [quote, setQuote] = useState('')

  useEffect(() => {
    // Pick a random quote
    const randomQuote = inspirationalQuotes[Math.floor(Math.random() * inspirationalQuotes.length)]
    setQuote(randomQuote)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gold-50 via-white to-gold-50/30">
      <div className="text-center space-y-8 px-4">
        {/* Animated Logo */}
        <div className="relative">
          <div className="absolute inset-0 animate-pulse-gold opacity-40"></div>
          <Image
            src="/logo.png"
            alt="Golden Services Logo"
            width={120}
            height={120}
            className="mx-auto animate-fadeIn"
            priority
          />
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
            Golden Services
          </h2>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-gold-200"></div>
            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-gold-500 border-t-transparent animate-spin"></div>
          </div>
        </div>

        {/* Inspirational Quote */}
        {quote && (
          <div className="max-w-md mx-auto">
            <blockquote className="text-lg italic text-gray-700 animate-slideInLeft">
              "{quote}"
            </blockquote>
          </div>
        )}

        {/* Shimmer Effect */}
        <div className="mt-8 h-1 w-64 mx-auto bg-gold-200 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold-500 to-transparent animate-shimmer"></div>
        </div>
      </div>
    </div>
  )
}

// Smaller inline loading component
export function InlineLoader({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        <Image
          src="/logo.png"
          alt="Golden Services Logo"
          width={80}
          height={80}
          className="animate-pulse opacity-80"
        />
      </div>
      <div className="text-center space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border-3 border-gold-500 border-t-transparent animate-spin"></div>
          <p className="text-lg text-gray-600 font-medium">{message}</p>
        </div>
        <p className="text-sm text-gray-500">Please wait a moment...</p>
      </div>
    </div>
  )
}
