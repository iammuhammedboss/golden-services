import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
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

    const updatedMeasurement = await prisma.measurementItem.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updatedMeasurement)
  } catch (error) {
    console.error(`Error updating measurement ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update measurement' },
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

    await prisma.measurementItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      },
    })

    return NextResponse.json({ message: 'Measurement successfully deleted' })
  } catch (error) {
    console.error(`Error deleting measurement ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete measurement' },
      { status: 500 }
    )
  }
}
