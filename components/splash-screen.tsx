'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function SplashScreen() {
  const [phase, setPhase] = useState<'fade-in-1' | 'fade-out-1' | 'fade-in-2' | 'glow' | 'exit'>('fade-in-1')
  const [show, setShow] = useState(true)

  useEffect(() => {
    // Phase 1: Logo fades in (0 → 600ms)
    const t1 = setTimeout(() => setPhase('fade-out-1'), 600)
    // Phase 2: Logo fades out (600ms → 1200ms)
    const t2 = setTimeout(() => setPhase('fade-in-2'), 1200)
    // Phase 3: Logo fades back in with text (1200ms → 1800ms)
    const t3 = setTimeout(() => setPhase('glow'), 1800)
    // Phase 4: Hold with glow, then exit (2800ms → 3300ms)
    const t4 = setTimeout(() => setPhase('exit'), 2800)
    const t5 = setTimeout(() => setShow(false), 3300)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5) }
  }, [])

  if (!show) return null

  const logoOpacity =
    phase === 'fade-in-1' ? 'opacity-100' :
    phase === 'fade-out-1' ? 'opacity-0' :
    'opacity-100'

  const showText = phase === 'fade-in-2' || phase === 'glow' || phase === 'exit'

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-500 ${
        phase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Subtle radial glow behind logo */}
      <div className={`absolute h-64 w-64 rounded-full transition-all duration-1000 ${
        phase === 'glow' ? 'bg-gold-100 scale-100 opacity-60' : 'scale-50 opacity-0'
      }`} style={{ filter: 'blur(40px)' }} />

      <div className="relative text-center space-y-5 px-4">
        {/* Logo */}
        <div className={`transition-all duration-600 ${logoOpacity}`} style={{ transitionDuration: '600ms' }}>
          <Image
            src="/logo.png"
            alt="Golden Services"
            width={100}
            height={100}
            className={`mx-auto drop-shadow-lg transition-transform duration-700 ${
              phase === 'glow' ? 'scale-110' : 'scale-100'
            }`}
            priority
          />
        </div>

        {/* Company name — appears on second fade-in */}
        <div className={`space-y-2 transition-all duration-500 ${
          showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Golden <span className="text-gold-600">Services</span>
          </h1>
          <p className="text-xs tracking-widest text-gray-400 uppercase">
            Professional Excellence, Every Time
          </p>
        </div>

        {/* Minimal loading dots */}
        <div className={`flex gap-1.5 justify-center transition-opacity duration-500 ${
          showText ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="h-1.5 w-1.5 rounded-full bg-gold-400 animate-pulse" />
          <div className="h-1.5 w-1.5 rounded-full bg-gold-500 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="h-1.5 w-1.5 rounded-full bg-gold-600 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
