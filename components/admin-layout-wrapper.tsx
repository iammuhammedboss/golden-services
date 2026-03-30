'use client'

import { useEffect, useState } from 'react'
import { SplashScreen } from './splash-screen'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { OfflineIndicator } from './offline-indicator'

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      <div className="flex min-h-screen">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex flex-1 flex-col md:pl-64">
          <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 p-3 md:p-6">{children}</main>
        </div>
        <OfflineIndicator />
      </div>
    </>
  )
}
