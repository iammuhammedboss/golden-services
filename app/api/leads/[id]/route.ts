import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    console.error(`Error updating lead ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await prisma.lead.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        // You might want to also set a deletedById here
        // deletedById: session.user.id
      },
    })

    return NextResponse.json({ message: 'Lead successfully deleted' })
  } catch (error) {
    console.error(`Error deleting lead ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
