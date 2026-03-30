'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-800'
    case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    case 'COMPLETED': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getVisitStatusColor(status: string) {
  switch (status) {
    case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
    case 'COMPLETED': return 'bg-green-100 text-green-800'
    case 'SKIPPED': return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getJobStatusColor(status: string) {
  switch (status) {
    case 'SCHEDULED': return 'secondary'
    case 'IN_PROGRESS': return 'default'
    case 'COMPLETED': return 'outline'
    case 'CANCELLED': return 'destructive'
    default: return 'secondary'
  }
}

export default function AmcContractDetailPage() {
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    fetchContract()
  }, [id])

  async function fetchContract() {
    try {
      const res = await fetch(`/api/amc-contracts/${id}`)
      if (res.ok) {
        setContract(await res.json())
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(action: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/amc-contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        await fetchContract()
      }
    } catch (error) {
      console.error(`Failed to ${action} contract:`, error)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!contract) return <div className="p-6">Contract not found</div>

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalVisits = contract.visits.length
  const completedVisits = contract.visits.filter((v: any) => v.status === 'COMPLETED').length
  const overdueVisits = contract.visits.filter(
    (v: any) => v.status === 'SCHEDULED' && new Date(v.scheduledDate) < today
  ).length
  const progressPercent = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{contract.contractNumber}</h1>
          <p className="text-muted-foreground">{contract.client.name}</p>
        </div>
        <div className="flex gap-2">
          {contract.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('pause')}
              disabled={actionLoading}
            >
              Pause
            </Button>
          )}
          {contract.status === 'PAUSED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction('resume')}
              disabled={actionLoading}
            >
              Resume
            </Button>
          )}
          {(contract.status === 'ACTIVE' || contract.status === 'PAUSED') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction('cancel')}
              disabled={actionLoading}
            >
              Cancel Contract
            </Button>
          )}
        </div>
      </div>

      {/* Contract Info Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(contract.status)}`}>
              {contract.status}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Frequency</p>
            <p className="text-lg font-semibold">{contract.frequency.replace('_', '-')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-lg font-semibold">{contract.durationMonths} months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Progress</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">{progressPercent}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Details */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Client</p>
              <p className="font-medium">{contract.client.name}</p>
              {contract.client.phone && (
                <p className="text-muted-foreground">{contract.client.phone}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Quotation</p>
              <p className="font-medium font-mono">{contract.quotation.quotationNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">{formatDate(contract.startDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">End Date</p>
              <p className="font-medium">{formatDate(contract.endDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Visits</p>
              <p className="font-medium">{totalVisits}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Completed / Overdue</p>
              <p className="font-medium">
                {completedVisits} completed
                {overdueVisits > 0 && (
                  <span className="ml-2 text-red-500">{overdueVisits} overdue</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contract.visits.map((visit: any) => {
              const visitDate = new Date(visit.scheduledDate)
              const isOverdue = visit.status === 'SCHEDULED' && visitDate < today
              const isUpcoming = visit.status === 'SCHEDULED' && visitDate >= today

              return (
                <div
                  key={visit.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isOverdue ? 'border-red-200 bg-red-50' :
                    isUpcoming ? 'border-blue-200 bg-blue-50' :
                    visit.status === 'COMPLETED' ? 'border-green-200 bg-green-50' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm">
                      {visit.visitNumber}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatDate(visit.scheduledDate)}</p>
                      {visit.jobOrder && (
                        <p className="text-xs text-muted-foreground">
                          Job: {visit.jobOrder.jobNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {visit.jobOrder && (
                      <Badge variant={getJobStatusColor(visit.jobOrder.status) as any}>
                        {visit.jobOrder.status}
                      </Badge>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getVisitStatusColor(visit.status)}`}>
                      {isOverdue ? 'OVERDUE' : visit.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
