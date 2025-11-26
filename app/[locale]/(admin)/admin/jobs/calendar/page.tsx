'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JobsCalendar } from '@/components/jobs-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function JobsCalendarPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as string) || 'en'
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectEvent = (event: any) => {
    router.push(`/${locale}/admin/jobs/${event.id}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Jobs Calendar</h1>
          <Button variant="outline" onClick={() => router.push(`/${locale}/admin/jobs`)}>
            ← Back to List
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading calendar...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jobs Calendar</h1>
          <p className="text-muted-foreground">View and manage job schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/${locale}/admin/jobs`)}>
            List View
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
            New Job
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Calendar</CardTitle>
          <CardDescription>
            Click on an event to view job details. Use month/week/day views to see different time ranges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JobsCalendar jobs={jobs} onSelectEvent={handleSelectEvent} />
        </CardContent>
      </Card>
    </div>
  )
}
