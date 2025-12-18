import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageLeads } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

export async function POST(
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
    const originalClient = await prisma.client.findUnique({
      where: { id: params.id },
    })

    if (!originalClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Create a duplicate with modified name
    const duplicateClient = await prisma.client.create({
      data: {
        name: `${originalClient.name} (Copy)`,
        phone: originalClient.phone,
        alternatePhone: originalClient.alternatePhone,
        whatsapp: originalClient.whatsapp,
        email: originalClient.email,
        type: originalClient.type,
        source: originalClient.source,
        status: 'NEW', // Reset status to NEW for the copy
        isTemporary: originalClient.isTemporary,
        notes: originalClient.notes,
      },
    })

    return NextResponse.json(duplicateClient)
  } catch (error) {
    console.error(`Error duplicating client ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to duplicate client' },
      { status: 500 }
    )
  }
}
