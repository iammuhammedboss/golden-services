'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
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
import { PlusCircle, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Client, Site, User, ItemMaster, RoomTypeMaster } from '@prisma/client'
import { useRouter } from 'next/navigation'

const measurementItemSchema = z.object({
  itemTypeId: z.string().min(1, 'Item type is required'),
  roomTypeId: z.string().optional(),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  size: z.string().optional(),
  customDescription: z.string().optional(),
  notes: z.string().optional(),
})

const streamlinedFormSchema = z.object({
  clientId: z.string().optional(),
  newClient: z
    .object({
      name: z.string().min(1, 'Client name is required'),
      phone: z.string().min(1, 'Client phone is required'),
    })
    .optional(),
  siteId: z.string().optional(),
  newSite: z
    .object({
      name: z.string().min(1, 'Site name is required'),
      address: z.string().min(1, 'Site address is required'),
    })
    .optional(),
  scheduledAt: z.string().datetime('Scheduled date and time is required'),
  assignedToId: z.string().min(1, 'Assigned user is required'),
  notes: z.string().optional(),
  measurements: z.array(measurementItemSchema).min(1, 'At least one measurement is required'),
}).superRefine((data, ctx) => {
  if (!data.clientId && !data.newClient) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either select an existing client or create a new one.',
      path: ['clientId'],
    })
  }
  if (!data.siteId && !data.newSite) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either select an existing site or create a new one.',
      path: ['siteId'],
    })
  }
})

type StreamlinedFormValues = z.infer<typeof streamlinedFormSchema>

export function StreamlinedMeasurementForm() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [itemTypes, setItemTypes] = useState<ItemMaster[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomTypeMaster[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [showNewSiteForm, setShowNewSiteForm] = useState(false)

  const form = useForm<StreamlinedFormValues>({
    resolver: zodResolver(streamlinedFormSchema),
    defaultValues: {
      measurements: [{ itemTypeId: '', quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'measurements',
  })

  const selectedClientId = form.watch('clientId')

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [clientsRes, usersRes, itemTypesRes, roomTypesRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/users'),
          fetch('/api/item-masters'),
          fetch('/api/masters/room-types'),
        ])
        setClients(await clientsRes.json())
        setUsers(await usersRes.json())
        setItemTypes(await itemTypesRes.json())
        setRoomTypes(await roomTypesRes.json())
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
        // TODO: Show an error toast
      }
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchSites = async () => {
      if (selectedClientId && selectedClientId !== 'new') {
        try {
          const sitesRes = await fetch(
            `/api/clients/${selectedClientId}/sites`
          )
          setSites(await sitesRes.json())
        } catch (error) {
          console.error('Failed to fetch sites:', error)
          // TODO: Show an error toast
        }
      } else {
        setSites([])
      }
    }
    fetchSites()
  }, [selectedClientId])

  async function onSubmit(data: StreamlinedFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/measurements/streamlined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create measurement')
      }

      const result = await response.json()
      // TODO: Show a success toast
      alert('Measurements created successfully!')
      router.push(`/admin/site-visits/${result.id}`)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'An unknown error occurred.') // TODO: Show an error toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Client & Site</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      if (value === 'new') {
                        setShowNewClientForm(true)
                        form.setValue('siteId', '') // Clear site selection when creating new client
                      } else {
                        setShowNewClientForm(false)
                        form.setValue('newClient', undefined)
                      }
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">Create a new client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showNewClientForm && (
              <>
                <FormField
                  control={form.control}
                  name="newClient.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Client Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newClient.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Client Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Client Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      if (value === 'new') {
                        setShowNewSiteForm(true)
                      } else {
                        setShowNewSiteForm(false)
                        form.setValue('newSite', undefined)
                      }
                    }}
                    defaultValue={field.value}
                    disabled={!selectedClientId && !showNewClientForm}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new">Create a new site</SelectItem>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showNewSiteForm && (
              <>
                <FormField
                  control={form.control}
                  name="newSite.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Site Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Site Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newSite.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Site Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Site Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Site Visit Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scheduled At</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Site visit notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Measurements</h2>
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border p-4 space-y-4 relative grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                            control={form.control}
                            name={`measurements.${index}.itemTypeId`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Controller
                            control={form.control}
                            name={`measurements.${index}.roomTypeId`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Room Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a room type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roomTypes.map((rt) => (
                                                <SelectItem key={rt.id} value={rt.id}>
                                                    {rt.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Controller
                            control={form.control}
                            name={`measurements.${index}.quantity`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Controller
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
                        <Controller
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
                        <Controller
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
                ))}
            </div>
            <div className="flex items-center space-x-2 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ itemTypeId: '', quantity: 1 })}
                >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add another measurement
                </Button>
            </div>
        </div>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Measurement'}
        </Button>
      </form>
    </Form>
  )
}
