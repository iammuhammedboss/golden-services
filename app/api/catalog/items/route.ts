import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/catalog/items
 * Fetch catalog items (ItemMaster) for selection in measurement tree
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await prisma.itemMaster.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        category: true,
        defaultPrice: true,
        canBeRootLevel: true,
        allowedParentTypes: true,
        allowedChildTypes: true,
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching catalog items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalog items' },
      { status: 500 }
    )
  }
}
