import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageLeads } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// POST /api/leads/[id]/convert - Convert lead to client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageLeads(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to manage leads' },
        { status: 403 }
      )
    }

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.deletedAt) {
      return NextResponse.json({ error: 'Lead has been deleted' }, { status: 400 })
    }

    // Check if lead is already converted
    if (lead.convertedToClientId) {
      const existingClient = await prisma.client.findUnique({
        where: { id: lead.convertedToClientId },
      })

      if (existingClient) {
        return NextResponse.json({
          message: 'Lead already converted to client',
          client: existingClient,
        })
      }
    }

    // Check if client with same phone already exists
    let existingClient = await prisma.client.findFirst({
      where: {
        phone: lead.phone,
        deletedAt: null,
      },
    })

    if (existingClient) {
      // Link lead to existing client
      await prisma.lead.update({
        where: { id: params.id },
        data: {
          convertedToClientId: existingClient.id,
          status: 'CONVERTED',
        },
      })

      // Create audit log
      await createAuditLog({
        userId: user.id,
        action: 'UPDATE',
        entityType: 'Lead',
        entityId: lead.id,
        oldValues: lead,
        newValues: { ...lead, convertedToClientId: existingClient.id, status: 'CONVERTED' },
      })

      return NextResponse.json({
        message: 'Lead linked to existing client',
        client: existingClient,
        isNewClient: false,
      })
    }

    // Create new client from lead
    const body = await request.json()
    const { type, alternatePhone, additionalNotes } = body

    const client = await prisma.client.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        whatsapp: lead.phone, // Default to same as phone
        email: lead.email,
        type: type || 'INDIVIDUAL',
        alternatePhone: alternatePhone || null,
        notes: `Converted from lead. Original notes: ${lead.notes || 'None'}${
          additionalNotes ? `\n\nAdditional: ${additionalNotes}` : ''
        }`,
      },
    })

    // Update lead to mark as converted
    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        convertedToClientId: client.id,
        status: 'CONVERTED',
      },
    })

    // Create audit logs
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Client',
      entityId: client.id,
      newValues: client,
    })

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Lead',
      entityId: lead.id,
      oldValues: lead,
      newValues: updatedLead,
    })

    return NextResponse.json({
      message: 'Lead successfully converted to client',
      client,
      lead: updatedLead,
      isNewClient: true,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/leads/[id]/convert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
