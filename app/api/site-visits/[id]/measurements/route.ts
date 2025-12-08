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

    // Validate each measurement
    for (const m of measurements) {
      if (!m.itemTypeId) {
        return NextResponse.json(
          { error: 'Item type is required for all measurements' },
          { status: 400 }
        )
      }
      if (!m.quantity || m.quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be positive for all measurements' },
          { status: 400 }
        )
      }
    }

    // First, check if a measurement already exists for this site visit
    let measurement = await prisma.measurement.findFirst({
      where: {
        siteVisitId,
        deletedAt: null,
      },
    });

    // If no measurement exists, create one
    if (!measurement) {
      // Get site visit details to create measurement title
      const siteVisit = await prisma.siteVisit.findUnique({
        where: { id: siteVisitId },
        include: {
          client: true,
          site: true,
        },
      });

      measurement = await prisma.measurement.create({
        data: {
          clientId: siteVisit?.clientId || '',
          siteId: siteVisit?.siteId || null,
          siteVisitId,
          title: `Measurement for ${siteVisit?.client?.name || 'Client'} - ${new Date().toLocaleDateString()}`,
          status: 'DRAFT',
        },
      });
    }

    // Create measurement objects
    const createdObjects = await prisma.$transaction(
      measurements.map((m) =>
        prisma.measurementObject.create({
          data: {
            measurementId: measurement.id,
            type: 'ITEM',
            name: m.customDescription || `Item from measurement`,
            itemMasterId: m.itemTypeId,
            size: m.size || null,
            dirtLevel: m.dirtLevel || null,
            quantity: m.quantity,
            notes: m.notes || null,
            sortOrder: 0,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      measurement,
      objects: createdObjects,
      count: createdObjects.length,
    });
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

    // Get measurement for this site visit
    const measurement = await prisma.measurement.findFirst({
      where: { 
        siteVisitId,
        deletedAt: null 
      },
      include: {
        objects: {
          where: { deletedAt: null },
          include: {
            itemMaster: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!measurement) {
      return NextResponse.json([]);
    }

    // Format response to match expected structure
    const formattedMeasurements = measurement.objects.map(obj => ({
      id: obj.id,
      itemTypeId: obj.itemMasterId,
      itemType: obj.itemMaster,
      quantity: obj.quantity,
      size: obj.size,
      customDescription: obj.name,
      notes: obj.notes,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }));

    return NextResponse.json(formattedMeasurements);
  } catch (error) {
    console.error('Error fetching measurements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    )
  }
}
