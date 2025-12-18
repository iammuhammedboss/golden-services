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

    const templates = await prisma.termsTemplate.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching terms templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch terms templates' },
      { status: 500 }
    )
  }
}
