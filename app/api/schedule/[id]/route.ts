import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewSchedule } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/schedule/[id] - Get a single schedule entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entry = await prisma.scheduleEntry.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        jobOrder: true,
        siteVisit: true,
        lead: true,
        assignees: {
          include: {
            employee: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!entry || entry.deletedAt) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    // TODO: Add permission check to ensure user can view this specific entry

    return NextResponse.json(entry)
  } catch (error) {
    console.error('GET /api/schedule/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/schedule/[id] - Update a schedule entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as UserWithRoles

    const entryToUpdate = await prisma.scheduleEntry.findUnique({
        where: { id: params.id },
        include: { assignees: true }
    });

    if (!entryToUpdate || entryToUpdate.deletedAt) {
        return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 });
    }

    const isManager = canManageAllSchedules(user);
    const isAssignee = entryToUpdate.assignees.some(a => a.employeeId === user.id);

    if (!isManager && !isAssignee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const { startDateTime, endDateTime, status, assigneeIds, ...rest } = body

    // TODO: Implement conflict checking logic here if time or assignees change

    const updateData: any = { ...rest }
    if (startDateTime) updateData.startDateTime = new Date(startDateTime)
    if (endDateTime) updateData.endDateTime = new Date(endDateTime)
    if (status) updateData.status = status

    const updatedEntry = await prisma.scheduleEntry.update({
      where: { id: params.id },
      data: updateData,
    })

    // Handle assignee changes, only managers should be able to change assignees
    if (assigneeIds && isManager) {
      await prisma.scheduleEntryAssignee.deleteMany({
        where: { scheduleEntryId: params.id },
      })
      await prisma.scheduleEntryAssignee.createMany({
        data: assigneeIds.map((id: string) => ({
          scheduleEntryId: params.id,
          employeeId: id,
          roleInVisit: 'TECHNICIAN', // Default role
        })),
      })
    }

    const finalEntry = await prisma.scheduleEntry.findUnique({
      where: { id: params.id },
      include: { assignees: { include: { employee: true } } },
    })

    return NextResponse.json(finalEntry)
  } catch (error) {
    console.error('PATCH /api/schedule/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/schedule/[id] - Soft delete a schedule entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as UserWithRoles

    const entryToDelete = await prisma.scheduleEntry.findUnique({
        where: { id: params.id },
        include: { assignees: true }
    });

    if (!entryToDelete || entryToDelete.deletedAt) {
        return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 });
    }

    const isManager = canManageAllSchedules(user);
    const isAssignee = entryToDelete.assignees.some(a => a.employeeId === user.id);

    if (!isManager && !isAssignee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Perform soft delete
    await prisma.scheduleEntry.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    return new NextResponse(null, { status: 204 }) // No Content
  } catch (error) {
    console.error('DELETE /api/schedule/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
