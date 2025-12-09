import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

async function getMeasurementObjects(measurementId: string) {
    const objects = await prisma.measurementObject.findMany({
        where: { measurementId, parentObjectId: null },
        orderBy: { sortOrder: 'asc' },
    });

    for (const obj of objects) {
        (obj as any).children = await getChildren(obj.id);
    }

    return objects;
}

async function getChildren(parentObjectId: string): Promise<any[]> {
    const children = await prisma.measurementObject.findMany({
        where: { parentObjectId },
        orderBy: { sortOrder: 'asc' },
    });

    for (const child of children) {
        (child as any).children = await getChildren(child.id);
    }

    return children;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const measurement = await prisma.measurement.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        site: true,
      },
    })

    if (!measurement) {
      return NextResponse.json({ error: 'Measurement not found' }, { status: 404 })
    }

    const objects = await getMeasurementObjects(params.id)

    return NextResponse.json({ ...measurement, objects })
  } catch (error) {
    console.error(`Error fetching measurement ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch measurement' },
      { status: 500 }
    )
  }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles
    if (!canManageLeads(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { objects, ...measurementData } = body

        const oldMeasurement = await prisma.measurement.findUnique({ where: { id: params.id } });

        const updatedMeasurement = await prisma.$transaction(async (prisma) => {
            const measurement = await prisma.measurement.update({
                where: { id: params.id },
                data: measurementData,
            })

            if (objects) {
                await prisma.measurementObject.deleteMany({
                    where: { measurementId: params.id },
                })

                const createObjects = async (objects: any[], parentObjectId: string | null = null) => {
                    for (const obj of objects) {
                        const { children, ...rest } = obj
                        const createdObject = await prisma.measurementObject.create({
                            data: {
                                ...rest,
                                measurementId: params.id,
                                parentObjectId,
                            },
                        })
                        if (children && children.length > 0) {
                            await createObjects(children, createdObject.id)
                        }
                    }
                }
                await createObjects(objects)
            }

            return measurement
        })
        
        await createAuditLog({
            userId: user.id,
            action: 'UPDATE',
            entityType: 'Measurement',
            entityId: updatedMeasurement.id,
            oldValues: oldMeasurement,
            newValues: updatedMeasurement,
        })

        return NextResponse.json(updatedMeasurement)
    } catch (error) {
        console.error(`Error updating measurement ${params.id}:`, error)
        return NextResponse.json(
            { error: 'Failed to update measurement' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles
    if (!canManageLeads(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const oldMeasurement = await prisma.measurement.findUnique({ where: { id: params.id } });

        const deletedMeasurement = await prisma.measurement.update({
            where: { id: params.id },
            data: { 
                deletedAt: new Date(),
                deletedById: user.id,
            },
        })
        
        await createAuditLog({
            userId: user.id,
            action: 'DELETE',
            entityType: 'Measurement',
            entityId: deletedMeasurement.id,
            oldValues: oldMeasurement,
            newValues: deletedMeasurement,
        })

        return NextResponse.json({ message: 'Measurement deleted successfully' })
    } catch (error) {
        console.error(`Error deleting measurement ${params.id}:`, error)
        return NextResponse.json(
            { error: 'Failed to delete measurement' },
            { status: 500 }
        )
    }
}