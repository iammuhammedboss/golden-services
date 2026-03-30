'use client'

import { signOut, useSession } from 'next-auth/react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { NotificationBell } from './notification-bell'

export function AdminHeader() {
  const { data: session } = useSession()
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const locale = (params.locale as string) || 'en'

  const isMenuPage = pathname === `/${locale}/admin/dashboard`

  const handleLogout = async () => {
    await signOut({ callbackUrl: `/${locale}/login` })
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-3">
          {/* Back button - shown on all pages except the main menu */}
          {!isMenuPage && (
            <button
              className="rounded-lg p-1.5 hover:bg-accent"
              onClick={() => router.push(`/${locale}/admin/dashboard`)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xs font-bold">GS</span>
            </div>
            <h2 className="text-base font-semibold md:text-lg">Golden Services</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <NotificationBell />
          {session?.user && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-xs font-semibold">
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
