import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * @deprecated The Lead entity is deprecated. All new customer entries should go directly into the Client model.
 * This endpoint is disabled and will return a 410 Gone status.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'This endpoint is deprecated and no longer available.' },
    { status: 410 }
  )
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leads = await prisma.lead.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
