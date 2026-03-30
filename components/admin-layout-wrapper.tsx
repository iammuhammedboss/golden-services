'use client'

import { useEffect, useState } from 'react'
import { SplashScreen } from './splash-screen'
import { AdminHeader } from './admin-header'
import { OfflineIndicator } from './offline-indicator'

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    const hasShownSplash = sessionStorage.getItem('hasShownSplash')
    if (!hasShownSplash) {
      setShowSplash(true)
      sessionStorage.setItem('hasShownSplash', 'true')
      const clearOnUnload = () => sessionStorage.removeItem('hasShownSplash')
      window.addEventListener('beforeunload', clearOnUnload)
      return () => window.removeEventListener('beforeunload', clearOnUnload)
    }
  }, [])

  return (
    <>
      {showSplash && <SplashScreen />}
      <div className="flex min-h-screen flex-col">
        <AdminHeader />
        <main className="flex-1 p-3 md:p-6">{children}</main>
        <OfflineIndicator />
      </div>
    </>
  )
}
