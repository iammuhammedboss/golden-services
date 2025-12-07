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
    const itemMasters = await prisma.itemMaster.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(itemMasters)
  } catch (error) {
    console.error('Error fetching item masters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item masters' },
      { status: 500 }
    )
  }
}
