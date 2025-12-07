import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RoomData } from '@/components/room-manager' // Assuming this path is correct

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { clientId, leadId, scheduledAt, rooms } = body as {
      clientId: string
      leadId?: string
      scheduledAt: string
      rooms: RoomData[]
    }

    if (!clientId || !scheduledAt || !rooms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const newSiteVisit = await prisma.$transaction(async (tx) => {
      const siteVisit = await tx.siteVisit.create({
        data: {
          clientId,
          leadId,
          scheduledAt: new Date(scheduledAt),
          status: 'SCHEDULED',
          assignedToId: session.user.id, // Assign to current user
        },
      })

    const createRooms = async (rooms: RoomData[], parentId?: string) => {
      for (const roomData of rooms) {
        const room = await tx.room.create({
          data: {
            siteVisitId: siteVisit.id,
            roomType: roomData.name,
            customName: roomData.name,
            parentId,
          },
        })

        for (const itemData of roomData.items) {
          await tx.roomItem.create({
            data: {
              roomId: room.id,
              itemMasterId: itemData.itemMasterId,
              quantity: itemData.quantity,
              size: itemData.size,
              dirtLevel: itemData.dirtLevel,
              notes: itemData.notes,
            },
          })

          if (itemData.photos && itemData.photos.length > 0) {
            await tx.photo.createMany({
              data: itemData.photos.map(url => ({
                url,
                roomId: room.id,
                uploadedById: session.user.id,
                phase: 'BEFORE',
              }))
            })
          }
        }
        
        if (roomData.subRooms && roomData.subRooms.length > 0) {
          await createRooms(roomData.subRooms, room.id)
        }
      }
    }
    
    await createRooms(rooms)

    return siteVisit
})

    return NextResponse.json(newSiteVisit, { status: 201 })
  } catch (error) {
    console.error('Error creating site visit:', error)
    return NextResponse.json(
      { error: 'Failed to create site visit' },
      { status: 500 }
    )
  }
}