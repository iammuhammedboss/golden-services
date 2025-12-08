'use client'

import { useState } from 'react'
import { MeasurementForm } from '@/components/measurement-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlusCircle, List } from 'lucide-react'

export default function MeasurementsPage() {
  const [activeTab, setActiveTab] = useState('new')

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
                onSubmitSuccess={() => {
                  setActiveTab('list')
                  // Refresh measurements list
                }}
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
              <div className="text-center py-8 text-muted-foreground">
                <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Measurements list will appear here</p>
                <p className="text-sm mt-2">Use the "Create New" tab to add your first measurement</p>
              </div>
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
