'use client'

import { useState, useEffect } from 'react'
import { SiteVisit } from '@prisma/client'
import { MeasurementForm } from '@/components/measurement-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export default function MeasurementsPage() {
  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([])
  const [selectedSiteVisit, setSelectedSiteVisit] = useState<SiteVisit | null>(
    null
  )

  useEffect(() => {
    async function fetchSiteVisits() {
      try {
        const response = await fetch('/api/site-visits')
        const data = await response.json()
        setSiteVisits(data)
      } catch (error) {
        console.error('Failed to fetch site visits:', error)
      }
    }
    fetchSiteVisits()
  }, [])

  const handleSiteVisitChange = (id: string) => {
    const visit = siteVisits.find((sv) => sv.id === id) || null
    setSelectedSiteVisit(visit)
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Record Measurements</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Label htmlFor="site-visit-selector">Select a Site Visit</Label>
          <Select onValueChange={handleSiteVisitChange}>
            <SelectTrigger id="site-visit-selector">
              <SelectValue placeholder="Choose a completed site visit..." />
            </SelectTrigger>
            <SelectContent>
              {siteVisits
                .filter((sv) => sv.status === 'COMPLETED')
                .map((sv) => (
                  <SelectItem key={sv.id} value={sv.id}>
                    {`Visit for ${sv.clientId || sv.leadId} on ${new Date(
                      sv.scheduledAt
                    ).toLocaleDateString()}`}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSiteVisit && (
          <div className="mt-8 p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">
              Adding Measurements for Visit on {new Date(selectedSiteVisit.scheduledAt).toLocaleDateString()}
            </h2>
            <MeasurementForm siteVisitId={selectedSiteVisit.id} />
          </div>
        )}
      </div>
    </div>
  )
}
