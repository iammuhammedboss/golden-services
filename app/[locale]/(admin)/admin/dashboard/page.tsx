import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Decimal } from '@prisma/client/runtime/library'

export default async function DashboardPage() {
  const now = new Date()

  // Date ranges
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)

  const next7Days = new Date(today)
  next7Days.setDate(today.getDate() + 7)
  next7Days.setHours(23, 59, 59, 999)

  // Fetch statistics
  const [
    totalSalesThisMonth,
    totalSalesToday,
    leadsThisMonth,
    jobsDoneToday,
    recentLeads,
    upcomingReminders,
    todaySchedule,
  ] = await Promise.all([
    // Total Sales This Month
    prisma.invoice.aggregate({
      where: {
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
        issueDate: {
          gte: startOfMonth,
        },
        deletedAt: null,
      },
      _sum: {
        total: true,
      },
    }),
    // Total Sales Today
    prisma.invoice.aggregate({
      where: {
        status: { in: ['PAID', 'PARTIALLY_PAID'] },
        issueDate: {
          gte: today,
          lt: tomorrow,
        },
        deletedAt: null,
      },
      _sum: {
        total: true,
      },
    }),
    // Leads This Month
    prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
        deletedAt: null,
      },
    }),
    // Jobs Done Today
    prisma.jobOrder.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
        deletedAt: null,
      },
    }),
    // Recent Leads
    prisma.lead.findMany({
      take: 5,
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    // Upcoming Reminders (Customer Notes with reminders)
    prisma.customerNote.findMany({
      where: {
        isReminder: true,
        reminderDate: {
          gte: today,
          lte: next7Days,
        },
        deletedAt: null,
      },
      take: 10,
      orderBy: {
        reminderDate: 'asc',
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
    }),
    // Today's Schedule
    prisma.scheduleEntry.findMany({
      where: {
        startDateTime: {
          gte: today,
          lt: tomorrow,
        },
        deletedAt: null,
      },
      orderBy: {
        startDateTime: 'asc',
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
        jobOrder: {
          select: {
            jobNumber: true,
          },
        },
        siteVisit: {
          select: {
            id: true,
          },
        },
      },
    }),
  ])

  const salesThisMonth = totalSalesThisMonth._sum.total
    ? Number(totalSalesThisMonth._sum.total)
    : 0
  const salesToday = totalSalesToday._sum.total
    ? Number(totalSalesToday._sum.total)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your business.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">OMR {salesThisMonth.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              This month • Today: OMR {salesToday.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs Done Today</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobsDoneToday}</div>
            <p className="text-xs text-muted-foreground">{formatDate(today, 'PP')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedule Today</CardTitle>
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaySchedule.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled items</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid: Left side (Recent Leads + Schedule) and Right side (Reminders) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Takes 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Leads</CardTitle>
              <CardDescription>Latest inquiries from potential customers</CardDescription>
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
                          {lead.email && <span>{lead.email}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5">{lead.source}</span>
                          {lead.serviceInterest && (
                            <span className="rounded-full bg-muted px-2 py-0.5">{lead.serviceInterest}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'CONTACTED' ? 'bg-purple-100 text-purple-800' :
                            lead.status === 'WON' ? 'bg-green-100 text-green-800' :
                            lead.status === 'LOST' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(lead.createdAt, 'PPp')}</p>
                      </div>
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
              <CardDescription>Scheduled activities for {formatDate(today, 'PP')}</CardDescription>
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
                          {entry.jobOrder && ` • ${entry.jobOrder.jobNumber}`}
                        </p>
                        {entry.locationText && (
                          <p className="text-xs text-muted-foreground">{entry.locationText}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDate(entry.startDateTime, 'p')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          to {formatDate(entry.endDateTime, 'p')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No scheduled activities for today</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Takes 1/3 width */}
        <div className="space-y-6">
          {/* Reminders & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Reminders & Notes</CardTitle>
              <CardDescription>Upcoming reminders (next 7 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingReminders.length > 0 ? (
                <div className="space-y-3">
                  {upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-medium line-clamp-2">{reminder.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {reminder.client?.name || 'General'}
                      </p>
                      {reminder.reminderDate && (
                        <p className="text-xs font-medium text-blue-600">
                          {formatDate(reminder.reminderDate, 'PPp')}
                        </p>
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
    </div>
  )
}
