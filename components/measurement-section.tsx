'use client'

import { useState } from 'react'
import {
  MeasurementItem,
  ItemMaster,
  RoomTypeMaster,
  SiteVisit,
  Room,
  Photo,
  RoomItem,
} from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MeasurementForm } from '@/components/measurement-form'
import { MeasurementList } from '@/components/measurement-list'
import { enumToReadable } from '@/lib/utils'

type SiteVisitWithRelations = SiteVisit & {
  rooms: (Room & {
    items: (RoomItem & {
      itemMaster: ItemMaster
    })[]
    photos: Photo[]
  })[]
  measurementItems: (MeasurementItem & {
    itemType: ItemMaster
    roomType: RoomTypeMaster | null
  })[]
}

interface MeasurementSectionProps {
  siteVisit: SiteVisitWithRelations
}

export function MeasurementSection({ siteVisit }: MeasurementSectionProps) {
  const [measurements, setMeasurements] = useState(siteVisit.measurementItems)

  const handleFormSuccess = async () => {
    // Refetch measurements
    const response = await fetch(
      `/api/site-visits/${siteVisit.id}/measurements`
    )
    const data = await response.json()
    setMeasurements(data)
  }

  const handleDelete = async (measurementId: string) => {
    if (confirm('Are you sure you want to delete this measurement?')) {
      try {
        const response = await fetch(`/api/measurements/${measurementId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setMeasurements(measurements.filter((m) => m.id !== measurementId))
        } else {
          // TODO: Show an error toast
          alert('Failed to delete measurement.')
        }
      } catch (error) {
        console.error(error)
        alert('An error occurred while deleting the measurement.')
      }
    }
  }

  return (
    <Tabs defaultValue="measurements">
      <TabsList>
        <TabsTrigger value="measurements">Measurements</TabsTrigger>
        <TabsTrigger value="rooms">Rooms & Photos</TabsTrigger>
      </TabsList>
      <TabsContent value="measurements" className="mt-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Add New Measurements</h3>
            <MeasurementForm
              siteVisitId={siteVisit.id}
              onSubmitSuccess={handleFormSuccess}
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Recorded Measurements
            </h3>
            <MeasurementList
              measurements={measurements}
              onEdit={() => {
                // TODO: Implement edit functionality
                alert('Edit functionality not implemented yet.')
              }}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="rooms" className="mt-4">
        {siteVisit.rooms.map((room) => (
          <div key={room.id} className="mb-6 border-b pb-6">
            <h3 className="text-xl font-semibold mb-2">{room.customName}</h3>
            {room.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
                {room.photos.map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.url.replace(
                      '/upload/',
                      '/upload/w_150,h_150,c_fill/'
                    )}
                    alt="Site visit photo"
                    className="rounded-md"
                  />
                ))}
              </div>
            )}
            {room.items.map((item) => (
              <div
                key={item.id}
                className="ml-4 mb-4 p-4 border rounded-md"
              >
                <p className="font-semibold">
                  {item.itemMaster.name} (x{item.quantity})
                </p>
                <div className="text-sm text-muted-foreground space-x-4">
                  <span>Size: {item.size}</span>
                  <span>Dirt: {enumToReadable(item.dirtLevel)}</span>
                </div>
                {item.notes && (
                  <p className="text-sm mt-2">Notes: {item.notes}</p>
                )}
              </div>
            ))}
          </div>
        ))}
        {siteVisit.rooms.length === 0 && (
          <p className="text-muted-foreground">
            No rooms recorded for this visit.
          </p>
        )}
      </TabsContent>
    </Tabs>
  )
}
