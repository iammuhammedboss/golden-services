import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles
  if (!canManageLeads(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        jobOrders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            jobNumber: true,
            status: true,
            paymentStatus: true,
            scheduledDate: true,
            location: true,
            quotation: {
              select: {
                id: true,
                items: {
                  where: { deletedAt: null },
                  select: { total: true },
                },
              },
            },
            _count: {
              select: {
                invoices: { where: { deletedAt: null } },
              },
            },
          },
        },
        payments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          include: {
            recordedBy: { select: { name: true } },
            invoice: { select: { invoiceNumber: true } },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error(`Error fetching client ${params.id}:`, error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PATCH /api/clients/[id] - Update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles
  if (!canManageLeads(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const existing = await prisma.client.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, phone, alternatePhone, whatsapp, email, type, source, status, notes } = body

    const updated = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(alternatePhone !== undefined && { alternatePhone: alternatePhone || null }),
        ...(whatsapp !== undefined && { whatsapp: whatsapp || null }),
        ...(email !== undefined && { email: email || null }),
        ...(type !== undefined && { type }),
        ...(source !== undefined && { source }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'Client',
      entityId: updated.id,
      oldValues: existing,
      newValues: updated,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(`Error updating client ${params.id}:`, error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Soft delete client
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user as UserWithRoles
  if (!canManageLeads(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const existing = await prisma.client.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    await prisma.client.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'Client',
      entityId: params.id,
      oldValues: existing,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting client ${params.id}:`, error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
