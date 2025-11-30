import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageQuotations } from '@/lib/permissions'
import { Decimal } from '@prisma/client/runtime/library'

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

// POST /api/quotations - Create a new quotation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage quotations
    const currentUser = session.user as any
    if (!canManageQuotations(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { clientId, siteId, leadId, validUntil, notes, items } = body

    // Validation
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one line item is required' },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.description || !item.description.trim()) {
        return NextResponse.json(
          { error: 'All items must have a description' },
          { status: 400 }
        )
      }
      if (!item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'All items must have a valid quantity' },
          { status: 400 }
        )
      }
      if (!item.unit) {
        return NextResponse.json(
          { error: 'All items must have a unit' },
          { status: 400 }
        )
      }
    }

    // Get the latest quotation version for this client
    const latestQuotation = await prisma.quotation.findFirst({
      where: { clientId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const version = latestQuotation ? latestQuotation.version + 1 : 1

    // Create quotation with items
    const quotation = await prisma.quotation.create({
      data: {
        clientId,
        siteId: siteId || null,
        leadId: leadId || null,
        version,
        createdById: currentUser.id,
        status: 'DRAFT',
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            serviceId: item.serviceId || null,
            description: item.description.trim(),
            quantity: new Decimal(item.quantity),
            unit: item.unit,
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal(item.total),
          })),
        },
      },
      include: {
        items: true,
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
      },
    })

    return NextResponse.json({
      success: true,
      quotation,
    })
  } catch (error) {
    console.error('POST /api/quotations error:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    )
  }
}
