'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Measurement } from '@prisma/client'

type MeasurementWithClientAndSite = Measurement & {
  client: { id: string, name: string } | null,
  site: { id: string, name: string } | null,
}

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<MeasurementWithClientAndSite[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMeasurements = async () => {
    try {
      const response = await fetch('/api/measurements')
      if (response.ok) {
        const data = await response.json()
        setMeasurements(data)
      }
    } catch (error) {
      console.error('Failed to fetch measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeasurements()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Measurements</h1>
          <p className="text-muted-foreground">Manage your measurements</p>
        </div>
        <Button asChild>
            <Link href="/admin/measurements/new">+ New Measurement</Link>
        </Button>
      </div>

      {/* Measurements Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Measurements</CardTitle>
          <CardDescription>A list of all measurements in the system</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurements.length > 0 ? (
                measurements.map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell className="font-medium">{measurement.title}</TableCell>
                    <TableCell>{measurement.client?.name}</TableCell>
                    <TableCell>{measurement.site?.name}</TableCell>
                    <TableCell>{measurement.status}</TableCell>
                    <TableCell>{formatDate(measurement.createdAt, 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/measurements/${measurement.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No measurements found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}