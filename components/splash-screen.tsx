'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const welcomeQuotes = [
  "Welcome back! Ready to deliver excellence.",
  "Your dedication makes the difference.",
  "Together, we create exceptional experiences.",
  "Excellence is our standard, quality is our promise.",
  "Service with passion, quality with pride.",
]

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [quote, setQuote] = useState('')
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Pick random quote
    const randomQuote = welcomeQuotes[Math.floor(Math.random() * welcomeQuotes.length)]
    setQuote(randomQuote)

    // Start fade out after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2500)

    // Hide completely after 3 seconds
    const hideTimer = setTimeout(() => {
      setShow(false)
    }, 3000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gold-500 via-gold-400 to-gold-600 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-pulse delay-75"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-white/5 blur-2xl animate-pulse delay-150"></div>
      </div>

      <div className="relative z-10 text-center space-y-8 px-4">
        {/* Logo with Scale Animation */}
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl animate-pulse"></div>
          <div className="relative bg-white rounded-full p-8 shadow-2xl">
            <Image
              src="/logo.png"
              alt="Golden Services Logo"
              width={150}
              height={150}
              className="mx-auto"
              priority
            />
          </div>
        </div>

        {/* Company Name with Slide Animation */}
        <div className="space-y-3 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
            Golden Services
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light">
            Professional Excellence, Every Time
          </p>
        </div>

        {/* Quote with Fade Animation */}
        <div className="max-w-2xl mx-auto animate-fade-in-delayed">
          <p className="text-lg md:text-xl text-white/95 italic font-medium">
            "{quote}"
          </p>
        </div>

        {/* Loading Bar */}
        <div className="max-w-md mx-auto">
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full animate-loading-bar shadow-lg"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
