import { prisma } from '@/lib/prisma'
import { formatDate, enumToReadable, getInitials } from '@/lib/utils'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { AddUserDialog } from '@/components/add-user-dialog'
import { getTranslations } from 'next-intl/server'

export default async function UsersPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('Users')
  const tc = await getTranslations('Common')
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/${params.locale}/login`)

  const userId = session.user.id
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  })

  const userRoles = currentUser?.roles.map((r) => r.role.name) || []
  if (!userRoles.includes('OWNER') && !userRoles.includes('OPERATIONS_MANAGER')) {
    redirect(`/${params.locale}/admin/dashboard`)
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      roles: { include: { role: { select: { name: true } } } },
      _count: { select: { leads: true, siteVisits: true, jobAssignments: true } },
    },
  })

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-xs text-gray-400">{stats.total} {t('totalUsers')} &middot; {stats.active} {tc('active').toLowerCase()}</p>
        </div>
        <AddUserDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-800">{stats.total}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{tc('total')}</p>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-2.5 text-center shadow-sm">
          <p className="text-lg font-bold text-green-600">{stats.active}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{tc('active')}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-2.5 text-center shadow-sm">
          <p className="text-lg font-bold text-gray-400">{stats.inactive}</p>
          <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{tc('inactive')}</p>
        </div>
      </div>

      {/* User Cards */}
      <div className="space-y-2">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/${params.locale}/admin/users/${user.id}`}
            className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${
              user.isActive ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                {!user.isActive && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-500">{tc('inactive')}</span>}
              </div>
              <p className="text-xs text-gray-400">{user.email}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {user.roles.map((r) => (
                  <span key={r.role.name} className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                    {enumToReadable(r.role.name)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <p className="text-[10px] text-gray-300">{formatDate(user.createdAt, 'PP')}</p>
              {(user._count.leads > 0 || user._count.jobAssignments > 0) && (
                <p className="text-[10px] text-gray-400">
                  {user._count.leads > 0 && `${user._count.leads} leads`}
                  {user._count.leads > 0 && user._count.jobAssignments > 0 && ' · '}
                  {user._count.jobAssignments > 0 && `${user._count.jobAssignments} jobs`}
                </p>
              )}
              <svg className="h-4 w-4 text-gray-300 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
