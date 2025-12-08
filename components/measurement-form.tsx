'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ItemMaster, RoomTypeMaster } from '@prisma/client'

const measurementItemSchema = z.object({
  itemTypeId: z.string().min(1, 'Item type is required'),
  roomTypeId: z.string().optional(),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  size: z.string().optional(),
  dirtLevel: z.string().optional(),
  customDescription: z.string().optional(),
  notes: z.string().optional(),
})

const formSchema = z.object({
  siteId: z.string().optional(),
  notes: z.string().optional(),
  measurements: z.array(measurementItemSchema),
})

type MeasurementFormValues = z.infer<typeof formSchema>

interface MeasurementFormProps {
  onSubmitSuccess?: () => void
  initialClientId?: string
  initialSiteId?: string
  initialSiteVisitId?: string
}

export function MeasurementForm({
  onSubmitSuccess,
  initialClientId,
  initialSiteId,
  initialSiteVisitId,
}: MeasurementFormProps) {
  const [itemTypes, setItemTypes] = useState<ItemMaster[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomTypeMaster[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [clients, setClients] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')

  useEffect(() => {
    async function fetchMasters() {
      try {
        const [itemTypesRes, roomTypesRes, clientsRes] = await Promise.all([
          fetch('/api/item-masters'),
          fetch('/api/masters/room-types'),
          fetch('/api/clients'),
        ])
        setItemTypes(await itemTypesRes.json())
        setRoomTypes(await roomTypesRes.json())
        setClients(await clientsRes.json())
      } catch (error) {
        console.error('Failed to fetch master data:', error)
      }
    }
    fetchMasters()
  }, [])

  useEffect(() => {
    async function fetchSites() {
      if (!selectedClientId) {
        setSites([])
        return
      }
      try {
        const response = await fetch(`/api/sites?clientId=${selectedClientId}`)
        if (response.ok) {
          setSites(await response.json())
        }
      } catch (error) {
        console.error('Failed to fetch sites:', error)
      }
    }
    fetchSites()
  }, [selectedClientId])

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      measurements: [{ itemTypeId: '', quantity: 1 }],
    },
  })

  // Set initial client ID
  useEffect(() => {
    if (initialClientId) {
      setSelectedClientId(initialClientId)
    }
  }, [initialClientId])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'measurements',
  })

  async function onSubmit(data: MeasurementFormValues) {
    setIsLoading(true)
    try {
      // First, create a measurement
      const measurementResponse = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          siteId: form.getValues('siteId') || null,
          title: `Measurement ${new Date().toLocaleDateString()}`,
          notes: form.getValues('notes') || '',
          objects: data.measurements.map((m, idx) => ({
            type: 'ITEM',
            name: m.customDescription || `Item ${idx + 1}`,
            itemMasterId: m.itemTypeId,
            size: m.size || null,
            dirtLevel: m.dirtLevel || null,
            quantity: m.quantity,
            notes: m.notes || null,
            sortOrder: idx,
          })),
        }),
      })

      if (!measurementResponse.ok) {
        throw new Error('Failed to create measurement')
      }

      const result = await measurementResponse.json()
      
      form.reset()
      if (onSubmitSuccess) {
        onSubmitSuccess()
      }
    } catch (error) {
      console.error(error)
      // TODO: Show an error toast to the user
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Client and Site Selection */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold">Client & Site Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client-select">Select Client</Label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No clients found. Please create a client first.
                    </SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.phone}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-select">Select Site (Optional)</Label>
              <Select
                disabled={!selectedClientId}
                onValueChange={(value) => form.setValue('siteId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a site..." />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} - {site.address?.substring(0, 30)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Measurement Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any general notes about this measurement..."
              {...form.register('notes')}
            />
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-4 space-y-4 relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`measurements.${index}.itemTypeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an item type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {itemTypes.map((it) => (
                            <SelectItem key={it.id} value={it.id}>
                              {it.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`measurements.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`measurements.${index}.dirtLevel`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirt Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dirt level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LIGHT">Light</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HEAVY">Heavy</SelectItem>
                          <SelectItem value="SEVERE">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`measurements.${index}.size`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size (e.g. 3ft x 4ft)</FormLabel>
                      <FormControl>
                        <Input placeholder="Size" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`measurements.${index}.customDescription`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Sofa (3-seater)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name={`measurements.${index}.notes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any specific notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ itemTypeId: '', quantity: 1 })}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add another item
          </Button>
        </div>

        <div className="space-y-2">
          <Button type="submit" disabled={isLoading || !selectedClientId}>
            {isLoading ? 'Saving...' : 'Save Measurements'}
          </Button>
          {!selectedClientId && (
            <p className="text-sm text-muted-foreground">
              Please select a client to save measurements.
            </p>
          )}
        </div>
      </form>
    </Form>
  )
}
