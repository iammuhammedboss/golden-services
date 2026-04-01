import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/sales-executives - List all sales executives
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    const salesExecutives = await prisma.salesExecutive.findMany({
      where: {
        deletedAt: null,
        ...(all ? {} : { isActive: true }),
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(salesExecutives)
  } catch (error) {
    console.error('GET /api/sales-executives error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sales-executives - Create
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, name, email, phone } = body

    if (!code || !name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }

    const existing = await prisma.salesExecutive.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 })
    }

    const se = await prisma.salesExecutive.create({
      data: { code, name, email: email || null, phone: phone || null },
    })

    return NextResponse.json(se, { status: 201 })
  } catch (error) {
    console.error('POST /api/sales-executives error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
