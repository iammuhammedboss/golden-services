import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, message, source = 'WEBSITE', serviceInterest } = body

    // Validation
    if (!name || !phone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get session or use a default system user
    const session = await getServerSession(authOptions)

    let createdById = session?.user?.id

    // If no session, find or create a system user
    if (!createdById) {
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@goldenservices.om' },
      })

      if (!systemUser) {
        // Create a system user if it doesn't exist
        systemUser = await prisma.user.create({
          data: {
            name: 'System',
            email: 'system@goldenservices.om',
            hashedPassword: '', // No password for system user
            isActive: true,
          },
        })
      }

      createdById = systemUser.id
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        source,
        serviceInterest: serviceInterest || null,
        notes: message,
        status: 'NEW',
        createdById,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
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
