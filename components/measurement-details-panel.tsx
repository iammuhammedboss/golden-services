'use client'

import { useState, useEffect } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Badge } from './ui/badge'
import { Plus, Trash2, Save, Image, Video, X } from 'lucide-react'

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
  stains?: Stain[]
  areasOfNotice?: AreaOfNotice[]
  media?: Media[]
}

interface Stain {
  id: string
  description: string
  notes?: string | null
  photoUrl?: string | null
}

interface AreaOfNotice {
  id: string
  description: string
  notes?: string | null
  photoUrl?: string | null
}

interface Media {
  id: string
  type: 'PHOTO' | 'VIDEO'
  url: string
  thumbnailUrl?: string | null
  duration?: number | null
  caption?: string | null
  sortOrder: number
}

interface MeasurementDetailsPanelProps {
  measurementId: string
  selectedNode: MeasurementObject | null
  onRefresh: () => void
  onSelectNode?: (node: MeasurementObject | null) => void
}

export default function MeasurementDetailsPanel({
  measurementId,
  selectedNode,
  onRefresh,
}: MeasurementDetailsPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 text-gray-500">
        Select an item from the tree to see its details.
      </div>
    )
  }

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader>
        <CardTitle>{selectedNode.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {selectedNode.itemMaster?.category || selectedNode.type}
        </p>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <Tabs defaultValue="basic" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="size">Size</TabsTrigger>
            <TabsTrigger value="dirt">Dirt</TabsTrigger>
            <TabsTrigger value="stains">Stains</TabsTrigger>
            <TabsTrigger value="areas">Areas</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          <div className="flex-grow overflow-auto mt-4">
            <TabsContent value="basic" className="space-y-4">
              <BasicInfoTab
                measurementId={measurementId}
                node={selectedNode}
                onRefresh={onRefresh}
              />
            </TabsContent>
            <TabsContent value="size">
              <SizeTab
                measurementId={measurementId}
                node={selectedNode}
                onRefresh={onRefresh}
              />
            </TabsContent>
            <TabsContent value="dirt">
              <DirtTab
                measurementId={measurementId}
                node={selectedNode}
                onRefresh={onRefresh}
              />
            </TabsContent>
            <TabsContent value="stains">
              <StainsTab
                measurementId={measurementId}
                node={selectedNode}
                onRefresh={onRefresh}
              />
            </TabsContent>
            <TabsContent value="areas">
              <AreasTab
                measurementId={measurementId}
                node={selectedNode}
                onRefresh={onRefresh}
              />
            </TabsContent>
            <TabsContent value="notes">
              <NotesTab
                measurementId={measurementId}
                node={selectedNode}
                onRefresh={onRefresh}
              />
            </TabsContent>
            <TabsContent value="media">
              <MediaTab
                measurementId={measurementId}
                node={selectedNode}
                onRefresh={onRefresh}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// --- Helper for API calls ---
async function handleApiCall(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: any
) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'API call failed')
  }
  return response.json()
}

// --- Tabs ---

function BasicInfoTab({ measurementId, node, onRefresh }: { measurementId: string, node: MeasurementObject, onRefresh: () => void }) {
  const [name, setName] = useState(node.name)
  const [quantity, setQuantity] = useState(node.quantity)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setName(node.name)
    setQuantity(node.quantity)
  }, [node])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}`,
        'PUT',
        { name, quantity }
      )
      onRefresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}

function SizeTab({ measurementId, node, onRefresh }: { measurementId: string, node: MeasurementObject, onRefresh: () => void }) {
  const [sizeMode, setSizeMode] = useState(node.sizeMode || 'PRESET')
  const [size, setSize] = useState(node.size || '')
  const [dimLength, setDimLength] = useState(node.dimensionLength || '')
  const [dimWidth, setDimWidth] = useState(node.dimensionWidth || '')
  const [dimHeight, setDimHeight] = useState(node.dimensionHeight || '')
  const [dimUnit, setDimUnit] = useState(node.dimensionUnit || 'cm')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSizeMode(node.sizeMode || 'PRESET')
    setSize(node.size || '')
    setDimLength(node.dimensionLength || '')
    setDimWidth(node.dimensionWidth || '')
    setDimHeight(node.dimensionHeight || '')
    setDimUnit(node.dimensionUnit || 'cm')
  }, [node])

  const handleSave = async () => {
    setIsSaving(true)
    const body =
      sizeMode === 'PRESET'
        ? {
            sizeMode,
            size,
            dimensionLength: null,
            dimensionWidth: null,
            dimensionHeight: null,
            dimensionUnit: null,
          }
        : {
            sizeMode,
            size: null,
            dimensionLength: Number(dimLength) || null,
            dimensionWidth: Number(dimWidth) || null,
            dimensionHeight: Number(dimHeight) || null,
            dimensionUnit: dimUnit,
          }
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}`,
        'PUT',
        body
      )
      onRefresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Select value={sizeMode} onValueChange={(v) => setSizeMode(v as any)}>
        <SelectTrigger>
          <SelectValue placeholder="Select size mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PRESET">Preset</SelectItem>
          <SelectItem value="DIMENSIONS">Dimensions</SelectItem>
        </SelectContent>
      </Select>

      {sizeMode === 'PRESET' ? (
        <div>
          <Label htmlFor="size">Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue placeholder="Select preset size" />
            </SelectTrigger>
            <SelectContent>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Length</Label>
              <Input
                type="number"
                value={dimLength}
                onChange={(e) => setDimLength(e.target.value)}
              />
            </div>
            <div>
              <Label>Width</Label>
              <Input
                type="number"
                value={dimWidth}
                onChange={(e) => setDimWidth(e.target.value)}
              />
            </div>
            <div>
              <Label>Height</Label>
              <Input
                type="number"
                value={dimHeight}
                onChange={(e) => setDimHeight(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={dimUnit} onValueChange={setDimUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">cm</SelectItem>
                <SelectItem value="m">m</SelectItem>
                <SelectItem value="in">in</SelectItem>
                <SelectItem value="ft">ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Size'}
      </Button>
    </div>
  )
}

function DirtTab({ measurementId, node, onRefresh }: { measurementId: string, node: MeasurementObject, onRefresh: () => void }) {
  const [dirtLevel, setDirtLevel] = useState(node.dirtLevel)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => setDirtLevel(node.dirtLevel), [node])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}`,
        'PUT',
        { dirtLevel }
      )
      onRefresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }
  const DIRT_LEVELS = [
    { value: 'LEVEL_1', label: 'Level 1: Minimal' },
    { value: 'LEVEL_2', label: 'Level 2: Light' },
    { value: 'LEVEL_3', label: 'Level 3: Moderate' },
    { value: 'LEVEL_4', label: 'Level 4: Heavy' },
    { value: 'LEVEL_5', label: 'Level 5: Severe' },
  ]
  return (
    <div className="space-y-4">
      <Label>Dirt Level</Label>
      <Select
        value={dirtLevel || ''}
        onValueChange={(v) =>
          setDirtLevel(v as MeasurementObject['dirtLevel'])
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select dirt level" />
        </SelectTrigger>
        <SelectContent>
          {DIRT_LEVELS.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Dirt Level'}
      </Button>
    </div>
  )
}

function StainsTab({ measurementId, node, onRefresh }: { measurementId: string, node: MeasurementObject, onRefresh: () => void }) {
  const [stains, setStains] = useState<Stain[]>(node.stains || [])
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => setStains(node.stains || []), [node])

  const handleAdd = async () => {
    if (!description) return
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}/stains`,
        'POST',
        { description, notes }
      )
      onRefresh()
      setDescription('')
      setNotes('')
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }

  const handleDelete = async (stainId: string) => {
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}/stains/${stainId}`,
        'DELETE'
      )
      onRefresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 p-2 border rounded">
        <h4 className="font-semibold">Add Stain</h4>
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Button onClick={handleAdd}>Add Stain</Button>
      </div>
      <div className="space-y-2">
        {stains.map((stain) => (
          <div key={stain.id} className="flex justify-between items-center p-2 border rounded">
            <div>
              <p>{stain.description}</p>
              <p className="text-sm text-muted-foreground">{stain.notes}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(stain.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AreasTab({ measurementId, node, onRefresh }: { measurementId: string, node: MeasurementObject, onRefresh: () => void }) {
  const [areas, setAreas] = useState<AreaOfNotice[]>(node.areasOfNotice || [])
  const [description, setDescription] = useState('')

  useEffect(() => setAreas(node.areasOfNotice || []), [node])

  const handleAdd = async () => {
    if (!description) return
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}/areas`,
        'POST',
        { description }
      )
      onRefresh()
      setDescription('')
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }

  const handleDelete = async (areaId: string) => {
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}/areas/${areaId}`,
        'DELETE'
      )
      onRefresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }
  return (
    <div className="space-y-4">
      <div className="space-y-2 p-2 border rounded">
        <h4 className="font-semibold">Add Area of Notice</h4>
        <Input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button onClick={handleAdd}>Add Area</Button>
      </div>
      <div className="space-y-2">
        {areas.map((area) => (
          <div key={area.id} className="flex justify-between items-center p-2 border rounded">
            <p>{area.description}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(area.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotesTab({ measurementId, node, onRefresh }: { measurementId: string, node: MeasurementObject, onRefresh: () => void }) {
  const [notes, setNotes] = useState(node.notes || '')
  const [remarks, setRemarks] = useState(node.remarks || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setNotes(node.notes || '')
    setRemarks(node.remarks || '')
  }, [node])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}`,
        'PUT',
        { notes, remarks }
      )
      onRefresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea
          id="remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Notes'}
      </Button>
    </div>
  )
}

function MediaTab({ measurementId, node, onRefresh }: { measurementId: string, node: MeasurementObject, onRefresh: () => void }) {
  const [media, setMedia] = useState<Media[]>(node.media || [])
  const [type, setType] = useState<'PHOTO' | 'VIDEO'>('PHOTO')
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    setMedia(node.media || [])
  }, [node])

  const handleAdd = async () => {
    if (!url) return
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}/media`,
        'POST',
        { type, url, caption, sortOrder: Number(sortOrder) || 0 }
      )
      onRefresh()
      setUrl('')
      setCaption('')
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }

  const handleDelete = async (mediaId: string) => {
    try {
      await handleApiCall(
        `/api/measurements/${measurementId}/objects/${node.id}/media/${mediaId}`,
        'DELETE'
      )
      onRefresh()
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'An error occurred'}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 p-2 border rounded">
        <h4 className="font-semibold">Add Media</h4>
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Select media type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PHOTO">Photo</SelectItem>
            <SelectItem value="VIDEO">Video</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Input
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
         <Input
          placeholder="Sort Order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
        />
        <Button onClick={handleAdd}>Add Media</Button>
      </div>
      <div className="space-y-2">
        {media
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((m) => (
            <div key={m.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <Badge>{m.type}</Badge>
                <p>{m.caption || m.url}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(m.id)}
              >
                Delete
              </Button>
            </div>
          ))}
      </div>
    </div>
  )
}