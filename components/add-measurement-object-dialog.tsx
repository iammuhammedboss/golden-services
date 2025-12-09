'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MeasurementObjectType, ObjectSize, DirtLevel, ItemMaster } from '@prisma/client'
import { getSizeLabel, getDirtLevelLabel, getMeasurementObjectTypeLabel } from '@/lib/utils'

interface AddMeasurementObjectDialogProps {
  children: React.ReactNode
  measurementId: string
  parentId?: string | null
  onObjectCreated: (newObject: any) => void
}

export function AddMeasurementObjectDialog({
  children,
  measurementId,
  parentId = null,
  onObjectCreated,
}: AddMeasurementObjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [itemMasters, setItemMasters] = useState<ItemMaster[]>([])
  const [formData, setFormData] = useState<{
    type: MeasurementObjectType
    name: string
    itemMasterId: string
    size: ObjectSize
    dirtLevel: DirtLevel
    notes: string
  }>({
    type: MeasurementObjectType.ITEM,
    name: '',
    itemMasterId: '',
    size: ObjectSize.M,
    dirtLevel: DirtLevel.MEDIUM,
    notes: '',
  })

  useEffect(() => {
    async function fetchItemMasters() {
      try {
        const response = await fetch('/api/item-masters')
        if (response.ok) {
          const data = await response.json()
          setItemMasters(data)
        }
      } catch (error) {
        console.error('Failed to fetch item masters:', error)
      }
    }
    fetchItemMasters()
  }, [])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // This is a simplified example. In a real app, you'd likely
    // call an API endpoint here to save the new object.
    const newObject = {
      id: Date.now().toString(), // temporary ID
      ...formData,
      measurementId,
      parentId,
      children: [],
    }
    onObjectCreated(newObject)
    setOpen(false)
    setFormData({
        type: MeasurementObjectType.ITEM,
        name: '',
        itemMasterId: '',
        size: ObjectSize.M,
        dirtLevel: DirtLevel.MEDIUM,
        notes: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Measurement Item</DialogTitle>
          <DialogDescription>
            Add a new item to the measurement.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="itemMasterId">Master Item</Label>
            <Select
              value={formData.itemMasterId}
              onValueChange={(value) => {
                const selectedMaster = itemMasters.find(it => it.id === value);
                setFormData({ ...formData, itemMasterId: value, name: selectedMaster?.name || '' })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a master item" />
              </SelectTrigger>
              <SelectContent>
                {itemMasters.map(item => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Custom Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: MeasurementObjectType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(MeasurementObjectType).map(type => (
                  <SelectItem key={type} value={type}>{getMeasurementObjectTypeLabel(type)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select
              value={formData.size}
              onValueChange={(value: ObjectSize) =>
                setFormData({ ...formData, size: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ObjectSize).map(size => (
                  <SelectItem key={size} value={size}>{getSizeLabel(size)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dirtLevel">Dirt Level</Label>
            <Select
              value={formData.dirtLevel}
              onValueChange={(value: DirtLevel) =>
                setFormData({ ...formData, dirtLevel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dirt level" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DirtLevel).map(level => (
                  <SelectItem key={level} value={level}>{getDirtLevelLabel(level)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
