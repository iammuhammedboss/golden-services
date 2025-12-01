'use client'

import { useEffect, useState } from 'react'
import { SplashScreen } from './splash-screen'

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // Check if we should show splash (first time entering admin after login)
    const hasShownSplash = sessionStorage.getItem('hasShownSplash')

    if (!hasShownSplash) {
      setShowSplash(true)
      sessionStorage.setItem('hasShownSplash', 'true')

      // Clear the flag when user logs out (session ends)
      const clearOnUnload = () => sessionStorage.removeItem('hasShownSplash')
      window.addEventListener('beforeunload', clearOnUnload)

      return () => window.removeEventListener('beforeunload', clearOnUnload)
    }
  }, [])

  return (
    <>
      {showSplash && <SplashScreen />}
      {children}
    </>
  )
}
