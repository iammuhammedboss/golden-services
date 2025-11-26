import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/clients - List all clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        phone: true,
        whatsapp: true,
        email: true,
        type: true,
      },
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('GET /api/clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, whatsapp, email, type, notes } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        whatsapp: whatsapp || phone,
        email,
        type: type || 'INDIVIDUAL',
        notes,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('POST /api/clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
