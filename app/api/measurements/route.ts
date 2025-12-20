import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles

  // To be replaced with a more specific permission
  if (!canManageLeads(user)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions to create measurements' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { clientId, siteVisitId, location, title, notes, status, objects } = body

    if (!clientId || !title) {
      return NextResponse.json(
        { error: 'clientId and title are required' },
        { status: 400 }
      )
    }

    const createMeasurementAndObjects = async (objects: any[], parentId?: string): Promise<any> => {
      let createdObjects = []
      for (const obj of objects) {
        const { children, ...rest } = obj
        const createdObject = await prisma.measurementObject.create({
          data: {
            ...rest,
            parentId,
          },
        })
        if (children && children.length > 0) {
          await createMeasurementAndObjects(children, createdObject.id)
        }
        createdObjects.push(createdObject);
      }
      return createdObjects;
    }

    const measurement = await prisma.measurement.create({
      data: {
        clientId,
        siteVisitId: siteVisitId || null,
        location: location || null,
        title,
        notes: notes || null,
        status: status || 'DRAFT',
        objects: objects && objects.length > 0 ? {
          create: objects.map((obj: any) => {
            const { children, ...rest } = obj
            return {
              ...rest,
              children: {
                create: children?.map((child: any) => {
                  const { children: subChildren, ...subRest } = child;
                  return {
                    ...subRest,
                    children: {
                      create: subChildren?.map((subChild: any) => {
                        const { children: subSubChildren, ...subSubRest } = subChild;
                        return {
                          ...subSubRest
                        }
                      })
                    }
                  }
                })
              }
            }
          })
        } : undefined,
      },
    })
    
    await createAuditLog({
        userId: user.id,
        action: 'CREATE',
        entityType: 'Measurement',
        entityId: measurement.id,
        newValues: measurement,
      })

    return NextResponse.json(measurement, { status: 201 })
  } catch (error) {
    console.error('Error creating measurement:', error)
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const measurements = await prisma.measurement.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
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