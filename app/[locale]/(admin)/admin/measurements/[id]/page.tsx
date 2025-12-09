'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Measurement } from '@prisma/client'
import { CreateMeasurementForm } from '@/components/create-measurement-form'
import { MeasurementObjectTree } from '@/components/measurement-object-tree'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type MeasurementWithRelations = Measurement & {
  client: { id: string, name: string } | null,
  site: { id: string, name: string } | null,
  objects: any[]
}

export default function MeasurementDetailsPage() {
  const [measurement, setMeasurement] = useState<MeasurementWithRelations | null>(null)
  const [objects, setObjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const params = useParams()
  const router = useRouter()
  const { id } = params

  useEffect(() => {
    async function fetchMeasurement() {
      if (id === 'new') {
        setLoading(false)
        return
      }
      try {
        const response = await fetch(`/api/measurements/${id}`)
        if (response.ok) {
          const data = await response.json()
          setMeasurement(data)
          setObjects(data.objects)
        }
      } catch (error) {
        console.error('Failed to fetch measurement:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMeasurement()
  }, [id])

  const handleObjectCreated = (newObject: any, parentId?: string | null) => {
    if (parentId) {
      // Add to children of parent
      const newObjects = objects.map(o => {
        if (o.id === parentId) {
          return { ...o, children: [...o.children, newObject] }
        }
        // This is a simplified implementation. A real implementation would
        // need to recursively search for the parent.
        return o
      })
      setObjects(newObjects)
    } else {
      // Add as root object
      setObjects([...objects, newObject])
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...measurement, objects }),
      })
      if (response.ok) {
        // Optionally, show a success message
        router.push('/admin/measurements')
      }
    } catch (error) {
      console.error('Failed to save measurement:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }
  
  if (id === 'new') {
    return <CreateMeasurementForm />
  }

  if (!measurement) {
    return <div className="text-center text-muted-foreground">Measurement not found</div>
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{measurement.title}</h1>
            <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
                <p><strong>Client:</strong> {measurement.client?.name}</p>
                <p><strong>Site:</strong> {measurement.site?.name}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
                <MeasurementObjectTree
                    measurementId={measurement.id}
                    objects={objects}
                    onObjectCreated={handleObjectCreated}
                />
            </CardContent>
        </Card>
    </div>
  )
}
