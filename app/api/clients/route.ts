import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles
    
    // Check permissions
    if (!canManageLeads(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view clients' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      deletedAt: null,
    }

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (source && source !== 'ALL') {
      where.source = source
    }

    if (type && type !== 'ALL') {
      where.type = type
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        sites: {
          where: { deletedAt: null },
          select: { id: true, name: true }
        },
        siteVisits: {
          where: { deletedAt: null },
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: { scheduledAt: true }
        },
        _count: {
          select: {
            sites: { where: { deletedAt: null } },
            siteVisits: { where: { deletedAt: null } },
            quotations: { where: { deletedAt: null } },
            jobOrders: { where: { deletedAt: null } },
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format response
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      phone: client.phone,
      whatsapp: client.whatsapp,
      email: client.email,
      type: client.type,
      source: client.source,
      status: client.status,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      siteCount: client._count.sites,
      lastVisit: client.siteVisits[0]?.scheduledAt || null,
      quotationCount: client._count.quotations,
      jobCount: client._count.jobOrders,
      sites: client.sites,
    }))

    return NextResponse.json(formattedClients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles

  // Check permissions
  if (!canManageLeads(user)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions to create clients' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { 
      name, 
      phone, 
      email, 
      whatsapp, 
      alternatePhone,
      type = 'INDIVIDUAL',
      source = 'PHONE_CALL',
      status = 'NEW',
      notes,
      address,
      city,
      siteName
    } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    // Check for existing client with same phone
    const existingClient = await prisma.client.findFirst({
      where: {
        phone: phone,
        deletedAt: null,
      },
    })

    if (existingClient) {
      return NextResponse.json(
        { 
          error: 'Client with this phone number already exists',
          client: existingClient 
        },
        { status: 409 }
      )
    }

    // Create client
    const newClient = await prisma.client.create({
      data: {
        name,
        phone,
        email: email || null,
        whatsapp: whatsapp || phone,
        alternatePhone: alternatePhone || null,
        type,
        source,
        status,
        notes: notes || null,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Client',
      entityId: newClient.id,
      newValues: newClient,
    })

    // Create site if address is provided
    let site = null
    if (address) {
      site = await prisma.site.create({
        data: {
          clientId: newClient.id,
          name: siteName || 'Primary Site',
          address: address,
          city: city || null,
          type: 'RESIDENTIAL',
          notes: `Created with client`,
        },
      })

      await createAuditLog({
        userId: user.id,
        action: 'CREATE',
        entityType: 'Site',
        entityId: site.id,
        newValues: site,
      })
    }

    // Create notifications for relevant roles
    try {
      await prisma.notification.createMany({
        data: [
          {
            recipientRole: 'SALES',
            title: 'New Client Created',
            message: `New client ${name} (${phone}) was created by ${user.name || user.email}`,
            entityType: 'Client',
            entityId: newClient.id,
          },
          {
            recipientRole: 'RECEPTION',
            title: 'New Client Created',
            message: `New client ${name} (${phone}) was created by ${user.name || user.email}`,
            entityType: 'Client',
            entityId: newClient.id,
          },
        ],
      })
    } catch (error) {
      console.error('Failed to create notifications:', error)
      // Don't fail client creation if notifications fail
    }

    return NextResponse.json({ 
      client: newClient,
      site,
      message: 'Client created successfully' 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
