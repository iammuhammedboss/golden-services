import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const equipment = await prisma.equipmentMaster.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error fetching equipment masters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment masters' },
      { status: 500 }
    )
  }
}