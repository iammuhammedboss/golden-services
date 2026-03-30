import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/payment-methods - List all active payment methods with sub-options
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const methods = await prisma.paymentMethodMaster.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        subOptions: {
          where: { isActive: true, deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(methods)
  } catch (error) {
    console.error('GET /api/payment-methods error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
