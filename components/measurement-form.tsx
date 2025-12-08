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
import { ItemMaster, RoomTypeMaster } from '@prisma/client'

const measurementItemSchema = z.object({
  itemTypeId: z.string().min(1, 'Item type is required'),
  roomTypeId: z.string().optional(),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  size: z.string().optional(),
  customDescription: z.string().optional(),
  notes: z.string().optional(),
})

const formSchema = z.object({
  measurements: z.array(measurementItemSchema),
})

type MeasurementFormValues = z.infer<typeof formSchema>

interface MeasurementFormProps {
  siteVisitId: string
  onSubmitSuccess?: () => void
}

export function MeasurementForm({
  siteVisitId,
  onSubmitSuccess,
}: MeasurementFormProps) {
  const [itemTypes, setItemTypes] = useState<ItemMaster[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomTypeMaster[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchMasters() {
      try {
        const [itemTypesRes, roomTypesRes] = await Promise.all([
          fetch('/api/item-masters'),
          fetch('/api/masters/room-types'),
        ])
        setItemTypes(await itemTypesRes.json())
        setRoomTypes(await roomTypesRes.json())
      } catch (error) {
        console.error('Failed to fetch master data:', error)
      }
    }
    fetchMasters()
  }, [])

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      measurements: [{ itemTypeId: '', quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'measurements',
  })

  async function onSubmit(data: MeasurementFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/site-visits/${siteVisitId}/measurements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save measurements')
      }

      form.reset()
      onSubmitSuccess?.()
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
        <div className="space-y-4">
                    {fields.map((field, index) => (
            <div key={field.id} className="rounded-lg border p-4 space-y-4 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`measurements.${index}.itemTypeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type</FormLabel>
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
                  name={`measurements.${index}.roomTypeId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                <FormField
                  control={form.control}
                  name={`measurements.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
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
              </div>
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

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Measurements'}
        </Button>
      </form>
    </Form>
  )
}
