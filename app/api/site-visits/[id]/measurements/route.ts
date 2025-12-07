import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: siteVisitId } = params
    const body = await request.json()
    const { measurements } = body

    if (!Array.isArray(measurements)) {
      return NextResponse.json(
        { error: 'Invalid request body, expected an array of measurements' },
        { status: 400 }
      )
    }

    const createdMeasurements = await prisma.$transaction(
      measurements.map((m) =>
        prisma.measurementItem.create({
          data: {
            siteVisitId,
            itemTypeId: m.itemTypeId,
            roomTypeId: m.roomTypeId,
            quantity: m.quantity,
            size: m.size,
            customDescription: m.customDescription,
            notes: m.notes,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      measurements: createdMeasurements,
      count: createdMeasurements.length,
    })
  } catch (error) {
    console.error('Error creating measurements:', error)
    return NextResponse.json(
      { error: 'Failed to create measurements' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: siteVisitId } = params

    const measurements = await prisma.measurementItem.findMany({
      where: { siteVisitId },
      include: {
        itemType: true,
        roomType: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(measurements)
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}
