import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'

const menuTiles = [
  {
    name: 'Dashboard', tKey: 'overview',
    href: 'admin/dashboard/overview',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    description: 'Overview & stats',
  },
  {
    name: 'Clients',
    href: 'admin/clients',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    description: 'Customer profiles',
  },
  {
    name: 'Site Visits',
    href: 'admin/site-visits',
    color: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    description: 'Field inspections',
  },
  {
    name: 'Measurements',
    href: 'admin/measurements',
    color: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    description: 'Room & item scoping',
  },
  {
    name: 'Quotations',
    href: 'admin/quotations',
    color: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    description: 'Pricing & proposals',
  },
  {
    name: 'Invoices',
    href: 'admin/invoices',
    color: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
      </svg>
    ),
    description: 'Billing & payments',
  },
  {
    name: 'Jobs',
    href: 'admin/jobs',
    color: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    description: 'Job orders & dispatch',
  },
  {
    name: 'Payments',
    href: 'admin/payments',
    color: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    description: 'Payment records',
  },
  {
    name: 'AMC',
    href: 'admin/amc',
    color: 'from-teal-500 to-teal-600',
    bg: 'bg-teal-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    description: 'Maintenance contracts',
  },
  {
    name: 'Schedule',
    href: 'admin/schedule',
    color: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    description: 'Calendar & planning',
  },
  {
    name: 'Masters',
    href: 'admin/masters',
    color: 'from-slate-500 to-slate-600',
    bg: 'bg-slate-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: 'Settings & data',
  },
  {
    name: 'Reminders',
    href: 'admin/reminders',
    color: 'from-rose-500 to-rose-600',
    bg: 'bg-rose-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    description: 'Personal notes',
  },
  {
    name: 'Users',
    href: 'admin/users',
    color: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    description: 'Team management',
  },
]

export default async function DashboardPage({
  params,
}: {
  params: { locale: string }
}) {
  const locale = params.locale || 'en'
  const t = await getTranslations('Dashboard')
  const tc = await getTranslations('Common')

  const tileNames: Record<string, string> = {
    'Dashboard': t('overview'), 'Clients': t('clients'), 'Site Visits': t('siteVisits'),
    'Measurements': t('measurements'), 'Quotations': t('quotations'), 'Invoices': t('invoices'),
    'Jobs': t('jobs'), 'Payments': t('payments'), 'AMC': t('amc'),
    'Schedule': t('scheduleTile'), 'Masters': t('masters'), 'Reminders': t('reminders'), 'Users': t('users'),
  }
  const tileDescs: Record<string, string> = {
    'Dashboard': t('overviewDesc'), 'Clients': t('clientsDesc'), 'Site Visits': t('siteVisitsDesc'),
    'Measurements': t('measurementsDesc'), 'Quotations': t('quotationsDesc'), 'Invoices': t('invoicesDesc'),
    'Jobs': t('jobsDesc'), 'Payments': t('paymentsDesc'), 'AMC': t('amcDesc'),
    'Schedule': t('scheduleDesc'), 'Masters': t('mastersDesc'), 'Reminders': t('remindersDesc'), 'Users': t('usersDesc'),
  }

  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [totalSalesThisMonth, leadsThisMonth, jobsDoneToday, todayScheduleCount] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: {
          status: { in: ['PAID', 'PARTIALLY_PAID'] },
          issueDate: { gte: startOfMonth },
          deletedAt: null,
        },
        _sum: { total: true },
      }),
      prisma.lead.count({
        where: { createdAt: { gte: startOfMonth }, deletedAt: null },
      }),
      prisma.jobOrder.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: today, lt: tomorrow },
          deletedAt: null,
        },
      }),
      prisma.scheduleEntry.count({
        where: {
          startDateTime: { gte: today, lt: tomorrow },
          deletedAt: null,
        },
      }),
    ])

  const salesThisMonth = totalSalesThisMonth._sum.total
    ? Number(totalSalesThisMonth._sum.total)
    : 0

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      {/* Welcome Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md shadow-gold-200/40 ring-1 ring-gray-100">
          <Image src="/logo.png" alt="GS" width={28} height={28} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{t('title')}</h1>
          <p className="text-xs text-gray-400">{t('subtitle')}</p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t('sales'), value: `${salesThisMonth.toFixed(0)}`, unit: tc('omr'), color: 'text-blue-600', dot: 'bg-blue-500' },
          { label: t('leads'), value: `${leadsThisMonth}`, unit: '', color: 'text-emerald-600', dot: 'bg-emerald-500' },
          { label: t('jobsToday'), value: `${jobsDoneToday}`, unit: '', color: 'text-orange-600', dot: 'bg-orange-500' },
          { label: t('schedule'), value: `${todayScheduleCount}`, unit: '', color: 'text-indigo-600', dot: 'bg-indigo-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm"
          >
            <div className="flex items-center justify-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
              <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{stat.label}</span>
            </div>
            <p className={`mt-1 text-base font-bold ${stat.color} sm:text-lg`}>
              {stat.value}
              {stat.unit && <span className="ml-0.5 text-[10px] font-normal text-gray-400">{stat.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {menuTiles.map((tile, i) => (
          <Link
            key={tile.name}
            href={`/${locale}/${tile.href}`}
            className="group relative flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/60 hover:-translate-y-1 active:scale-95 sm:p-4"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {/* Icon container */}
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.color} text-white shadow-md transition-transform duration-200 group-hover:scale-110 sm:h-12 sm:w-12`}
              style={{ boxShadow: `0 4px 14px -2px color-mix(in srgb, currentColor 25%, transparent)` }}
            >
              {tile.icon}
            </div>

            {/* Label */}
            <span className="mt-2 text-[11px] font-semibold text-gray-700 sm:text-xs">{tileNames[tile.name] || tile.name}</span>
            <span className="mt-0.5 hidden text-[10px] leading-tight text-gray-400 sm:block">
              {tileDescs[tile.name] || tile.description}
            </span>
          </Link>
        ))}
      </div>

      {/* Bottom brand line */}
      <div className="pt-2 text-center">
        <p className="text-[10px] tracking-widest text-gray-300 uppercase">
          {t('tagline')}
        </p>
      </div>
    </div>
  )
}
