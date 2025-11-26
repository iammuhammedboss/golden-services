import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/quotations - List all quotations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const quotations = await prisma.quotation.findMany({
      where: clientId ? { clientId } : {},
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        validUntil: true,
        clientId: true,
        createdAt: true,
        client: {
          select: {
            name: true,
          },
        },
        site: {
          select: {
            name: true,
          },
        },
        items: {
          select: {
            total: true,
          },
        },
      },
    })

    return NextResponse.json(quotations)
  } catch (error) {
    console.error('GET /api/quotations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
