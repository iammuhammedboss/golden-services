import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewSchedule, canManageAllSchedules } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/schedule - List all schedule entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as UserWithRoles

    if (!canViewSchedule(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    let employeeId = searchParams.get('employeeId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    
    const where: any = {
      startDateTime: { gte: start ? new Date(start) : undefined },
      endDateTime: { lte: end ? new Date(end) : undefined },
      deletedAt: null,
    };

    const isManager = canManageAllSchedules(user);
    if (!isManager) {
        // If not a manager, force the filter to the current user's ID
        employeeId = user.id;
    }

    if (employeeId) {
        where.assignees = {
            some: {
                employeeId: employeeId,
            },
        };
    }

    if (type) {
        where.type = type;
    }

    if (status) {
        where.status = status;
    }

    const scheduleEntries = await prisma.scheduleEntry.findMany({
      where,
      include: {
        client: { select: { name: true } },
        jobOrder: { select: { jobNumber: true } },
        assignees: {
          include: {
            employee: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: {
        startDateTime: 'asc',
      },
    })

    return NextResponse.json(scheduleEntries)
  } catch (error) {
    console.error('GET /api/schedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule - Create a new schedule entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = session.user as UserWithRoles

    // TODO: Add fine-grained permissions for creating schedule entries
    if (!canViewSchedule(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      type,
      startDateTime,
      endDateTime,
      jobOrderId,
      siteVisitId,
      leadId,
      clientId,
      locationText,
      assigneeIds, // Expect an array of employee IDs
    } = body

    if (!type || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Type, startDateTime, and endDateTime are required' },
        { status: 400 }
      )
    }

    // TODO: Implement conflict checking logic here
    const newEntry = await prisma.$transaction(async (tx) => {
      if (assigneeIds && assigneeIds.length > 0) {
        const conflictingEntries = await tx.scheduleEntry.findMany({
          where: {
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
            assignees: { some: { employeeId: { in: assigneeIds } } },
            OR: [
              { startDateTime: { lt: new Date(endDateTime), gte: new Date(startDateTime) } },
              { endDateTime: { gt: new Date(startDateTime), lte: new Date(endDateTime) } },
            ],
          },
        });

        if (conflictingEntries.length > 0) {
          // For now, we just log it. A full implementation would return a warning to the user.
          console.warn(`Conflict detected: One or more assignees have overlapping schedule entries.`);
        }
      }

      return tx.scheduleEntry.create({
        data: {
          type,
          startDateTime: new Date(startDateTime),
          endDateTime: new Date(endDateTime),
          jobOrderId,
          siteVisitId,
          leadId,
          clientId,
          locationText,
          createdById: user.id,
          assignees: {
            create: assigneeIds?.map((id: string) => ({
              employeeId: id,
              roleInVisit: 'TECHNICIAN', // Default role, can be improved
            })) || [],
          },
        },
        include: {
          assignees: { include: { employee: true } },
        },
      });
    });

    return NextResponse.json(newEntry, { status: 201 })
  } catch (error) {
    console.error('POST /api/schedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
