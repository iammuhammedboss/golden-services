import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export default async function OverviewPage() {
  const now = new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)
  const next7Days = new Date(today)
  next7Days.setDate(today.getDate() + 7)
  next7Days.setHours(23, 59, 59, 999)

  const [
    totalSalesThisMonth,
    totalSalesToday,
    leadsThisMonth,
    jobsDoneToday,
    recentLeads,
    upcomingReminders,
    todaySchedule,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
        issueDate: { gte: startOfMonth },
        deletedAt: null,
      },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
        issueDate: { gte: today, lt: tomorrow },
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
    prisma.lead.findMany({
      take: 5,
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.customerNote.findMany({
      where: {
        isReminder: true,
        reminderDate: { gte: today, lte: next7Days },
        deletedAt: null,
      },
      take: 10,
      orderBy: { reminderDate: 'asc' },
      include: { client: { select: { name: true } } },
    }),
    prisma.scheduleEntry.findMany({
      where: {
        startDateTime: { gte: today, lt: tomorrow },
        deletedAt: null,
      },
      orderBy: { startDateTime: 'asc' },
      include: {
        client: { select: { name: true } },
        jobOrder: { select: { jobNumber: true } },
        siteVisit: { select: { id: true } },
      },
    }),
  ])

  const salesThisMonth = totalSalesThisMonth._sum.total
    ? Number(totalSalesThisMonth._sum.total) : 0
  const salesToday = totalSalesToday._sum.total
    ? Number(totalSalesToday._sum.total) : 0

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">OMR {salesThisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Today: OMR {salesToday.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Done</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsDoneToday}</div>
            <p className="text-xs text-muted-foreground">{formatDate(today, 'PP')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest inquiries</CardDescription>
            </CardHeader>
            <CardContent>
              {recentLeads.length > 0 ? (
                <div className="space-y-4">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="font-medium">{lead.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'WON' ? 'bg-green-100 text-green-800' :
                        lead.status === 'LOST' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No recent leads</p>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>{formatDate(today, 'PP')}</CardDescription>
            </CardHeader>
            <CardContent>
              {todaySchedule.length > 0 ? (
                <div className="space-y-4">
                  {todaySchedule.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.type.replace(/_/g, ' ')}</p>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            entry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            entry.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            entry.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.client.name}
                          {entry.jobOrder && ` - ${entry.jobOrder.jobNumber}`}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{formatDate(entry.startDateTime, 'p')}</p>
                        <p className="text-xs text-muted-foreground">to {formatDate(entry.endDateTime, 'p')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No scheduled activities</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length > 0 ? (
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div key={reminder.id} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium line-clamp-2">{reminder.content}</p>
                    <p className="text-xs text-muted-foreground">{reminder.client?.name || 'General'}</p>
                    {reminder.reminderDate && (
                      <p className="text-xs font-medium text-blue-600">{formatDate(reminder.reminderDate, 'PPp')}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">No upcoming reminders</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
