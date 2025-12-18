import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.bankDetailsTemplate.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching bank details templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank details templates' },
      { status: 500 }
    )
  }
}
