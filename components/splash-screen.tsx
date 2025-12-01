'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function SplashScreen() {
  const [show, setShow] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center space-y-6 px-4">
        {/* Logo */}
        <div className="animate-fadeIn">
          <Image
            src="/logo.png"
            alt="Golden Services Logo"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
        </div>

        {/* Company Name */}
        <div className="space-y-2 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gold-600 to-gold-400 bg-clip-text text-transparent">
            Golden Services
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Professional Excellence, Every Time
          </p>
        </div>

        {/* Simple Loading Indicator */}
        <div className="flex gap-2 justify-center pt-4">
          <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-gold-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  )
}
