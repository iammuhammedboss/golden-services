'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ScheduleCalendar, ScheduleEvent } from '@/components/schedule-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function JobsCalendarPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'en'
  const t = useTranslations('JobsCalendar')
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        // Transform jobs into calendar events
        const calendarEvents: ScheduleEvent[] = data.map((job: any) => ({
          id: job.id,
          title: `Job #${job.jobNumber} - ${job.client?.name || 'Unknown'}`,
          start: job.scheduledStartTime ? new Date(job.scheduledStartTime) : new Date(job.scheduledDate),
          end: job.scheduledEndTime ? new Date(job.scheduledEndTime) : new Date(job.scheduledDate),
          resource: {
            type: 'job' as const,
            status: job.status,
          },
        }))
        setEvents(calendarEvents)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: ScheduleEvent) => {
    router.push(`/${locale}/admin/jobs/${event.id}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <Button variant="outline" onClick={() => router.push(`/${locale}/admin/jobs`)}>
            {`\u2190 ${t('backToList')}`}
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">{t('loadingCalendar')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/admin/jobs`)}>
            {t('listView')}
          </Button>
          <Button onClick={() => router.push(`/${locale}/admin/jobs/new`)}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {t('newJob')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('scheduleCalendar')}</CardTitle>
          <CardDescription>
            {t('scheduleCalendarDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleCalendar events={events} onSelectEvent={handleSelectEvent} />
        </CardContent>
      </Card>
    </div>
  )
}
