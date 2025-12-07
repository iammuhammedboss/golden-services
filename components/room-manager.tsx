'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ItemMaster } from '@prisma/client'
import { Room } from './room'

export interface ItemData {
  id: string
  itemMasterId: string
  name: string
  quantity: number
  size: string
  dirtLevel: 'LIGHT' | 'MEDIUM' | 'HEAVY'
  notes: string
  photos: string[]
}

export interface RoomData {
  id: string
  name: string
  items: ItemData[]
  subRooms: RoomData[]
}

interface RoomManagerProps {
  onChange: (rooms: RoomData[]) => void
}

export function RoomManager({ onChange }: RoomManagerProps) {
  const [rooms, setRooms] = useState<RoomData[]>([])
  const [itemMasters, setItemMasters] = useState<ItemMaster[]>([])

  useEffect(() => {
    const fetchItemMasters = async () => {
      try {
        const response = await fetch('/api/item-masters')
        if (response.ok) {
          setItemMasters(await response.json())
        }
      } catch (error) {
        console.error('Failed to fetch item masters:', error)
      }
    }
    fetchItemMasters()
  }, [])

  useEffect(() => {
    onChange(rooms)
  }, [rooms, onChange])

  const addRoom = () => {
    const newRoom: RoomData = {
      id: `room_${Date.now()}`,
      name: `Room ${rooms.length + 1}`,
      items: [],
      subRooms: [],
    }
    setRooms([...rooms, newRoom])
  }

  const addSubRoom = (parentId: string) => {
    const newSubRoom: RoomData = {
      id: `room_${Date.now()}`,
      name: 'New Sub-Room',
      items: [],
      subRooms: [],
    }
    
    const update = (roomList: RoomData[]): RoomData[] => {
      return roomList.map(r => {
        if (r.id === parentId) {
          return { ...r, subRooms: [...r.subRooms, newSubRoom] }
        }
        return { ...r, subRooms: update(r.subRooms) }
      })
    }
    setRooms(update(rooms))
  }

  const removeRoom = (roomId: string) => {
    const remove = (roomList: RoomData[]): RoomData[] => {
      return roomList
        .filter(r => r.id !== roomId)
        .map(r => ({ ...r, subRooms: remove(r.subRooms) }))
    }
    setRooms(remove(rooms))
  }
  
  const updateRoomName = (roomId: string, name: string) => {
    const update = (roomList: RoomData[]): RoomData[] => {
      return roomList.map(r => {
        if (r.id === roomId) {
          return { ...r, name }
        }
        return { ...r, subRooms: update(r.subRooms) }
      })
    }
    setRooms(update(rooms))
  }
  
  const addItem = (roomId: string) => {
     const newItem: ItemData = {
      id: `item_${Date.now()}`,
      itemMasterId: '',
      name: '',
      quantity: 1,
      size: 'M',
      dirtLevel: 'MEDIUM',
      notes: '',
      photos: [],
    }
    const update = (roomList: RoomData[]): RoomData[] => {
      return roomList.map(r => {
        if (r.id === roomId) {
          return { ...r, items: [...r.items, newItem] }
        }
        return { ...r, subRooms: update(r.subRooms) }
      })
    }
    setRooms(update(rooms))
  }
  
  const removeItem = (roomId: string, itemId: string) => {
    const update = (roomList: RoomData[]): RoomData[] => {
       return roomList.map(r => {
        if (r.id === roomId) {
          return { ...r, items: r.items.filter(i => i.id !== itemId) }
        }
        return { ...r, subRooms: update(r.subRooms) }
      })
    }
    setRooms(update(rooms))
  }

  const updateItem = (roomId: string, itemId: string, field: keyof ItemData, value: any) => {
    const update = (roomList: RoomData[]): RoomData[] => {
      return roomList.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            items: r.items.map(i =>
              i.id === itemId ? { ...i, [field]: value } : i
            ),
          }
        }
        return { ...r, subRooms: update(r.subRooms) }
      })
    }
    setRooms(update(rooms))
  }

  const handlePhotoUpload = (roomId: string, itemId: string, url: string) => {
    const findAndUpdate = (roomList: RoomData[]): RoomData[] => {
        return roomList.map(r => {
            if (r.id === roomId) {
                const item = r.items.find(i => i.id === itemId)
                if (item) {
                    const updatedItems = r.items.map(i => i.id === itemId ? {...i, photos: [...i.photos, url]} : i)
                    return {...r, items: updatedItems}
                }
            }
            return {...r, subRooms: findAndUpdate(r.subRooms)}
        })
    }
    setRooms(findAndUpdate(rooms))
  }
  
  const handlePhotoRemove = (roomId: string, itemId: string, url: string) => {
    const findAndUpdate = (roomList: RoomData[]): RoomData[] => {
        return roomList.map(r => {
            if (r.id === roomId) {
                const item = r.items.find(i => i.id === itemId)
                if (item) {
                    const updatedItems = r.items.map(i => i.id === itemId ? {...i, photos: i.photos.filter(p => p !== url)} : i)
                    return {...r, items: updatedItems}
                }
            }
            return {...r, subRooms: findAndUpdate(r.subRooms)}
        })
    }
    setRooms(findAndUpdate(rooms))
  }

  return (
    <div className="space-y-4">
      {rooms.map((room) => (
        <Room
          key={room.id}
          room={room}
          itemMasters={itemMasters}
          onUpdateRoomName={updateRoomName}
          onRemoveRoom={removeRoom}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={updateItem}
          onAddSubRoom={addSubRoom}
          onPhotoUpload={handlePhotoUpload}
          onPhotoRemove={handlePhotoRemove}
        />
      ))}
      <Button type="button" variant="outline" className="w-full" onClick={addRoom}>
        <Plus className="h-4 w-4 mr-2" /> Add Room
      </Button>
    </div>
  )
}