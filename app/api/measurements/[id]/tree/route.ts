import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Recursively fetch measurement object tree with all relations
 */
async function getObjectTreeWithRelations(parentObjectId: string | null, measurementId: string): Promise<any[]> {
  const objects = await prisma.measurementObject.findMany({
    where: {
      measurementId,
      parentObjectId,
      deletedAt: null,
    },
    include: {
      itemMaster: {
        select: {
          id: true,
          name: true,
          category: true,
          defaultPrice: true,
          allowedParentTypes: true,
          allowedChildTypes: true,
          canBeRootLevel: true,
        },
      },
      stains: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      },
      areasOfNotice: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      },
      media: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // Recursively fetch children for each object
  for (const obj of objects) {
    (obj as any).children = await getObjectTreeWithRelations(obj.id, measurementId)
  }

  return objects
}

/**
 * GET /api/measurements/[id]/tree
 * Fetch the full measurement tree with stains, areas of notice, and media
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify measurement exists
    const measurement = await prisma.measurement.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        status: true,
      },
    })

    if (!measurement) {
      return NextResponse.json({ error: 'Measurement not found' }, { status: 404 })
    }

    // Fetch the complete tree starting from root objects
    const tree = await getObjectTreeWithRelations(null, params.id)

    return NextResponse.json({
      measurementId: measurement.id,
      title: measurement.title,
      status: measurement.status,
      tree,
    })
  } catch (error) {
    console.error(`Error fetching measurement tree ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch measurement tree' },
      { status: 500 }
    )
  }
}
