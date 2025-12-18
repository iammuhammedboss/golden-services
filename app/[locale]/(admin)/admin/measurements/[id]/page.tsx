'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MeasurementTreeView } from '@/components/measurement-tree-view'
import MeasurementDetailsPanel from '@/components/measurement-details-panel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { findNodeById } from '@/lib/utils' // Assuming you have this helper

// Based on prisma schema
interface MeasurementObject {
  id: string
  name: string
  type: string
  quantity: number
  sortOrder: number
  parentId: string | null
  sizeMode?: 'PRESET' | 'DIMENSIONS' | null
  size?: string | null
  dimensionLength?: number | null
  dimensionWidth?: number | null
  dimensionHeight?: number | null
  dimensionUnit?: string | null
  dirtLevel?: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4' | 'LEVEL_5' | null
  notes?: string | null
  remarks?: string | null
  itemMaster?: {
    id: string
    name: string
    category: string
  } | null
  stains?: any[]
  areasOfNotice?: any[]
  media?: any[]
  children?: MeasurementObject[]
}


interface MeasurementData {
  measurementId: string
  title: string
  status: string
  tree: MeasurementObject[]
}

export default function MeasurementDetailsPage() {
  const [measurement, setMeasurement] = useState<MeasurementData | null>(null)
  const [selectedNode, setSelectedNode] = useState<MeasurementObject | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const params = useParams()
  const router = useRouter()
  const { id } = params

  const fetchMeasurementTree = useCallback(async () => {
    if (!id || id === 'new') {
      setIsLoading(false)
      return
    }

    // Don't set loading to true here to avoid flicker on refresh
    setError(null)

    try {
      const response = await fetch(`/api/measurements/${id}/tree`)

      if (response.ok) {
        const data = await response.json()
        setMeasurement(data)

        // --- Selection Persistence ---
        if (selectedNode) {
          const newTree: MeasurementObject[] = data.tree || []
          const refreshedNode = findNodeById(newTree, selectedNode.id)
          setSelectedNode(refreshedNode || null) // Keep selection if found, otherwise clear
        }
        // ---------------------------
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load measurement')
      }
    } catch (error) {
      console.error('Failed to fetch measurement tree:', error)
      setError('Failed to load measurement. Please try again.')
    } finally {
      setIsLoading(false) // Only set to false after initial load
    }
  }, [id, selectedNode])

  useEffect(() => {
    setIsLoading(true)
    fetchMeasurementTree()
  }, [id, fetchMeasurementTree])

  if (id === 'new') {
    // This case should be handled by a different page or component
    // Redirecting to avoid invalid state
    router.push('/admin/measurements')
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading measurement...</p>
        </div>
      </div>
    )
  }

  if (error || !measurement) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive font-semibold mb-2">Error</p>
        <p className="text-muted-foreground mb-4">
          {error || 'Measurement not found'}
        </p>
        <Button
          onClick={() => router.push('/admin/measurements')}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Measurements
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/admin/measurements')}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {measurement.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  measurement.status === 'COMPLETED' ? 'default' : 'secondary'
                }
              >
                {measurement.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-6 overflow-hidden">
        {/* Left panel - Tree View */}
        <div className="lg:col-span-2 h-full">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <MeasurementTreeView
                measurementId={measurement.measurementId}
                tree={measurement.tree}
                selectedNode={selectedNode}
                onSelectNode={setSelectedNode}
                onRefresh={fetchMeasurementTree}
                isLoading={isLoading}
                error={error}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right panel - Details View */}
        <div className="lg:col-span-3 h-full">
          <MeasurementDetailsPanel
            measurementId={measurement.measurementId}
            selectedNode={selectedNode}
            onRefresh={fetchMeasurementTree}
            onSelectNode={setSelectedNode}
          />
        </div>
      </div>
    </div>
  )
}