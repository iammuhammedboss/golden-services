import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: siteId } = params

    const latestSiteVisit = await prisma.siteVisit.findFirst({
      where: {
        siteId,
        status: 'COMPLETED',
        deletedAt: null,
      },
      orderBy: {
        completedAt: 'desc',
      },
      select: {
        id: true,
      },
    })

    if (!latestSiteVisit) {
      return NextResponse.json([])
    }

    const measurements = await prisma.measurementItem.findMany({
      where: { siteVisitId: latestSiteVisit.id },
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
    console.error('Error fetching latest measurements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest measurements' },
      { status: 500 }
    )
  }
}
