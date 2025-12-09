'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface StartMeasurementButtonProps {
  siteVisitId: string
  locale: string
}

export function StartMeasurementButton({ siteVisitId, locale }: StartMeasurementButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/measurements/from-site-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteVisitId }),
      })
      if (response.ok) {
        const newMeasurement = await response.json()
        router.push(`/${locale}/admin/measurements/${newMeasurement.id}`)
      }
    } catch (error) {
      console.error('Failed to create measurement:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? 'Starting...' : 'Start Measurement'}
    </Button>
  )
}
