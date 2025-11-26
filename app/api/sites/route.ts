import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/sites - List all sites
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const sites = await prisma.site.findMany({
      where: clientId ? { clientId } : {},
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        clientId: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(sites)
  } catch (error) {
    console.error('GET /api/sites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sites - Create new site
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, name, address, city, notes } = body

    if (!clientId || !name || !address || !city) {
      return NextResponse.json(
        { error: 'Client, name, address, and city are required' },
        { status: 400 }
      )
    }

    const site = await prisma.site.create({
      data: {
        clientId,
        name,
        address,
        city,
        notes,
      },
      include: {
        client: true,
      },
    })

    return NextResponse.json(site, { status: 201 })
  } catch (error) {
    console.error('POST /api/sites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
