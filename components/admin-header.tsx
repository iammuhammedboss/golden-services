'use client'

import { signOut, useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { NotificationBell } from './notification-bell'

interface AdminHeaderProps {
  onMenuToggle?: () => void
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { data: session } = useSession()
  const params = useParams()
  const locale = (params.locale as string) || 'en'

  const handleLogout = async () => {
    await signOut({ callbackUrl: `/${locale}/login` })
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-3">
          {/* Hamburger menu - mobile only */}
          <button
            className="rounded-lg p-1.5 hover:bg-accent md:hidden"
            onClick={onMenuToggle}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-base font-semibold md:text-lg">Golden Services</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <NotificationBell />
          {session?.user && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground md:h-10 md:w-10">
                  <span className="text-xs font-semibold md:text-sm">
                    {getInitials(session.user.name || 'User')}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
