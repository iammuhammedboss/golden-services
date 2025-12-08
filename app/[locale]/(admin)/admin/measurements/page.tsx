'use client'

import { useState, useEffect } from 'react'
import { MeasurementForm } from '@/components/measurement-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, List, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatDate, enumToReadable } from '@/lib/utils'
import Link from 'next/link'

interface Measurement {
  id: string
  title: string
  status: string
  client: {
    name: string
  }
  site: {
    name: string
  } | null
  createdAt: string
}

export default function MeasurementsPage() {
  const [activeTab, setActiveTab] = useState('new')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'list') {
      fetchMeasurements()
    }
  }, [activeTab])

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

  const handleSubmitSuccess = () => {
    setActiveTab('list')
    fetchMeasurements()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Measurements</h1>
          <p className="text-muted-foreground">
            Create and manage detailed site measurements for quoting and job planning
          </p>
        </div>
        <Button onClick={() => setActiveTab('new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Measurement
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="new">Create New</TabsTrigger>
          <TabsTrigger value="list">All Measurements</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Measurement</CardTitle>
              <CardDescription>
                Record detailed measurements for a client's site. This will be used for quotations and job planning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MeasurementForm 
                onSubmitSuccess={handleSubmitSuccess}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>All Measurements</CardTitle>
              <CardDescription>
                View and manage all measurements in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : measurements.length > 0 ? (
                <div className="space-y-4">
                  {measurements.map((measurement) => (
                    <Card key={measurement.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{measurement.title}</h3>
                          <div className="text-sm text-muted-foreground mt-1">
                            Client: {measurement.client.name} | 
                            Site: {measurement.site?.name || 'Not specified'} | 
                            Created: {formatDate(measurement.createdAt, 'PP')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            measurement.status === 'COMPLETED' ? 'default' :
                            measurement.status === 'DRAFT' ? 'outline' : 'secondary'
                          }>
                            {enumToReadable(measurement.status)}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/measurements/${measurement.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No measurements found</p>
                  <p className="text-sm mt-2">Use the "Create New" tab to add your first measurement</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Measurement Templates</CardTitle>
              <CardDescription>
                Pre-defined measurement templates for common scenarios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Templates feature coming soon</p>
                <p className="text-sm mt-2">Save time by reusing measurement structures</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
