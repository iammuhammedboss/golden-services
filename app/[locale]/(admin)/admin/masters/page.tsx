import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function MastersPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations('Masters')
  const tc = await getTranslations('Common')
  const locale = params.locale

  const masterTiles = [
    {
      title: t('employees'),
      description: t('employeesDesc'),
      href: '/admin/masters/employees',
      color: 'from-blue-500 to-blue-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
    {
      title: t('equipment'),
      description: t('equipmentDesc'),
      href: '/admin/masters/equipment',
      color: 'from-orange-500 to-orange-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      title: t('materials'),
      description: t('materialsDesc'),
      href: '/admin/masters/materials',
      color: 'from-teal-500 to-teal-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
    },
    {
      title: t('units'),
      description: t('unitsDesc'),
      href: '/admin/masters/units',
      color: 'from-purple-500 to-purple-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    },
    {
      title: t('roomTypes'),
      description: t('roomTypesDesc'),
      href: '/admin/masters/room-types',
      color: 'from-indigo-500 to-indigo-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      title: t('paymentMethods'),
      description: t('paymentMethodsDesc'),
      href: '/admin/masters/payment-methods',
      color: 'from-green-500 to-green-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    },
    {
      title: t('services'),
      description: t('servicesDesc'),
      href: '/admin/masters/services',
      color: 'from-cyan-500 to-cyan-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    },
    {
      title: t('termsTemplates'),
      description: t('termsTemplatesDesc'),
      href: '/admin/masters/terms-templates',
      color: 'from-rose-500 to-rose-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    },
    {
      title: t('bankDetails'),
      description: t('bankDetailsDesc'),
      href: '/admin/masters/bank-details-templates',
      color: 'from-amber-500 to-amber-600',
      icon: <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
    },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-xs text-gray-400">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {masterTiles.map((tile) => (
          <Link
            key={tile.href}
            href={`/${locale}${tile.href}`}
            className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-3.5 text-center shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.color} text-white shadow-md transition-transform group-hover:scale-110`}>
              {tile.icon}
            </div>
            <span className="mt-2 text-[11px] font-semibold text-gray-700">{tile.title}</span>
            <span className="mt-0.5 hidden text-[10px] leading-tight text-gray-400 sm:block">{tile.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
