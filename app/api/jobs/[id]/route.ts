import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageJobs } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const job = await prisma.jobOrder.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        client: true,
        quotation: true,
        measurement: true,
        assignments: {
          include: {
            user: true,
          },
        },
        materials: {
            include: {
                material: true,
            }
        },
        equipment: {
            include: {
                equipment: true,
            }
        },
        checklistItems: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          include: {
            completedBy: {
              select: {
                name: true,
              },
            },
            verifiedBy: {
              select: {
                name: true,
              },
            },
          },
        },
        statusUpdates: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error(`Error fetching job ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
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
    if (!canManageJobs(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { assignments, materials, equipment, ...jobData } = body

        const updatedJob = await prisma.$transaction(async (prisma) => {
            const job = await prisma.jobOrder.update({
                where: { id: params.id },
                data: jobData,
            })

            if (assignments) {
                await prisma.jobAssignment.deleteMany({
                    where: { jobOrderId: params.id },
                })
                await prisma.jobAssignment.createMany({
                    data: assignments.map((a: any) => ({
                        ...a,
                        jobOrderId: params.id,
                    })),
                })
            }

            if (materials) {
                await prisma.jobMaterial.deleteMany({
                    where: { jobOrderId: params.id },
                })
                await prisma.jobMaterial.createMany({
                    data: materials.map((m: any) => ({
                        ...m,
                        jobOrderId: params.id,
                    })),
                })
            }

            if (equipment) {
                await prisma.jobEquipment.deleteMany({
                    where: { jobOrderId: params.id },
                })
                await prisma.jobEquipment.createMany({
                    data: equipment.map((e: any) => ({
                        ...e,
                        jobOrderId: params.id,
                    })),
                })
            }

            return job
        })

        return NextResponse.json(updatedJob)
    } catch (error) {
        console.error(`Error updating job ${params.id}:`, error)
        return NextResponse.json(
            { error: 'Failed to update job' },
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
    if (!canManageJobs(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        await prisma.jobOrder.update({
            where: { id: params.id },
            data: {
                deletedAt: new Date(),
                deletedById: user.id,
            },
        })

        return NextResponse.json({ message: 'Job deleted successfully' })
    } catch (error) {
        console.error(`Error deleting job ${params.id}:`, error)
        return NextResponse.json(
            { error: 'Failed to delete job' },
            { status: 500 }
        )
    }
}
