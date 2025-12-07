'use client'

import { RoomData, ItemData } from './room-manager'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus } from 'lucide-react'
import { ItemMaster } from '@prisma/client'
import { PhotoUploader } from './photo-uploader'

interface RoomProps {
  room: RoomData
  itemMasters: ItemMaster[]
  onUpdateRoomName: (roomId: string, name: string) => void
  onRemoveRoom: (roomId: string) => void
  onAddItem: (roomId: string) => void
  onRemoveItem: (roomId: string, itemId: string) => void
  onUpdateItem: (
    roomId: string,
    itemId: string,
    field: keyof ItemData,
    value: any
  ) => void
  onAddSubRoom: (parentId: string) => void
  onPhotoUpload: (roomId: string, itemId: string, url: string) => void
  onPhotoRemove: (roomId: string, itemId: string, url: string) => void
}

export function Room({
  room,
  itemMasters,
  onUpdateRoomName,
  onRemoveRoom,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onAddSubRoom,
  onPhotoUpload,
  onPhotoRemove,
}: RoomProps) {
  return (
    <AccordionItem key={room.id} value={room.id} className="border rounded-md px-4">
      <AccordionTrigger>
        <div className="flex items-center gap-2 w-full">
          <Input
            value={room.name}
            onChange={(e) => onUpdateRoomName(room.id, e.target.value)}
            className="text-lg font-semibold border-none focus-visible:ring-0 p-0"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-4">
        <div className="space-y-4">
          {room.items.map((item) => (
            <div key={item.id} className="border p-4 rounded-md space-y-4 relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={() => onRemoveItem(room.id, item.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item</Label>
                  <Select
                    value={item.itemMasterId}
                    onValueChange={(value) => {
                      const selectedMaster = itemMasters.find(im => im.id === value);
                      onUpdateItem(room.id, item.id, 'itemMasterId', value);
                      onUpdateItem(room.id, item.id, 'name', selectedMaster?.name || '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemMasters.map(master => (
                        <SelectItem key={master.id} value={master.id}>{master.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => onUpdateItem(room.id, item.id, 'quantity', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Select value={item.size} onValueChange={(value) => onUpdateItem(room.id, item.id, 'size', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">Small</SelectItem>
                      <SelectItem value="M">Medium</SelectItem>
                      <SelectItem value="L">Large</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dirt Level</Label>
                  <Select value={item.dirtLevel} onValueChange={(value) => onUpdateItem(room.id, item.id, 'dirtLevel', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LIGHT">Light</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HEAVY">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={item.notes}
                  onChange={(e) => onUpdateItem(room.id, item.id, 'notes', e.target.value)}
                  placeholder="e.g., specific stains, material type"
                />
              </div>
              <div className="space-y-2">
                <Label>Photos</Label>
                <PhotoUploader
                  uploadedUrls={item.photos}
                  onUpload={(url) => onPhotoUpload(room.id, item.id, url)}
                  onRemove={(url) => onPhotoRemove(room.id, item.id, url)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Sub Rooms */}
        {room.subRooms && room.subRooms.length > 0 && (
          <div className="ml-4 mt-4 space-y-4">
             <h4 className="font-semibold">Sub-Rooms / Attached Areas</h4>
            {room.subRooms.map((subRoom) => (
              <Room
                key={subRoom.id}
                room={subRoom}
                itemMasters={itemMasters}
                onUpdateRoomName={onUpdateRoomName}
                onRemoveRoom={onRemoveRoom}
                onAddItem={onAddItem}
                onRemoveItem={onRemoveItem}
                onUpdateItem={onUpdateItem}
                onAddSubRoom={onAddSubRoom}
                onPhotoUpload={onPhotoUpload}
                onPhotoRemove={onPhotoRemove}
              />
            ))}
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddItem(room.id)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddSubRoom(room.id)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Sub-Room
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onRemoveRoom(room.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Remove Room
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
