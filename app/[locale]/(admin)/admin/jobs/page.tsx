import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, enumToReadable, getStatusColor, formatTime } from '@/lib/utils'

export default async function JobsPage({ params, searchParams }: { params: { locale: string }; searchParams: { clientId?: string } }) {
  const clientId = searchParams.clientId
  const where: any = { deletedAt: null }
  if (clientId) where.clientId = clientId

  const jobs = await prisma.jobOrder.findMany({
    orderBy: { scheduledDate: 'desc' },
    where,
    include: {
      client: { select: { name: true, phone: true } },
      assignments: { select: { user: { select: { name: true } }, roleInJob: true } },
      _count: { select: { invoices: true } },
    },
  })

  const filterClient = clientId ? jobs[0]?.client?.name : null

  const stats = {
    total: jobs.length,
    scheduled: jobs.filter((j) => j.status === 'SCHEDULED').length,
    active: jobs.filter((j) => j.status === 'IN_PROGRESS').length,
    completed: jobs.filter((j) => j.status === 'COMPLETED').length,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {filterClient ? `${filterClient} — Jobs` : 'Jobs'}
        </h1>
        <p className="text-xs text-gray-400">
          {stats.total} {filterClient ? 'jobs for this client' : 'total jobs'}
          {clientId && (
            <> &middot; <a href={`/${params.locale}/admin/jobs`} className="text-primary underline">View all</a></>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'All', value: stats.total, color: 'text-gray-800' },
          { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-600' },
          { label: 'Active', value: stats.active, color: 'text-orange-600' },
          { label: 'Done', value: stats.completed, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-2.5 text-center shadow-sm">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Job Cards */}
      <div className="space-y-2">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/${params.locale}/admin/jobs/${job.id}/status`}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                job.status === 'COMPLETED' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                job.status === 'IN_PROGRESS' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                job.status === 'CANCELLED' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{job.jobNumber}</p>
                  <span className="text-xs text-gray-400">{job.client.name}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(job.scheduledDate, 'PP')}
                  {job.scheduledStartTime && ` ${formatTime(job.scheduledStartTime)}`}
                  {job.assignments.length > 0 && ` · ${job.assignments.length} crew`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(job.status)}`}>
                  {enumToReadable(job.status)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(job.paymentStatus || 'UNPAID')}`}>
                  {enumToReadable(job.paymentStatus || 'UNPAID')}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-12 text-center"><p className="text-sm text-gray-400">No jobs yet</p></div>
        )}
      </div>

      {/* FAB */}
      <Link
        href={`/${params.locale}/admin/jobs/new`}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-gold-600 text-white shadow-lg shadow-gold-300/40 transition-all hover:scale-105 active:scale-95"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    </div>
  )
}
