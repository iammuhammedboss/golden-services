import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewAmcContracts } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/amc-contracts - List all AMC contracts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as UserWithRoles
    if (!canViewAmcContracts(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: any = { deletedAt: null }
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const skip = (page - 1) * limit

    const [contracts, total] = await Promise.all([
      prisma.amcContract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          client: { select: { id: true, name: true, phone: true } },
          quotation: {
            select: {
              id: true,
              quotationNumber: true,
              items: {
                where: { deletedAt: null },
                select: { quantity: true, unitPrice: true },
              },
            },
          },
          visits: {
            select: { id: true, status: true, scheduledDate: true },
            orderBy: { scheduledDate: 'asc' },
          },
        },
      }),
      prisma.amcContract.count({ where }),
    ])

    // Add computed fields
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const enriched = contracts.map((c) => {
      const totalVisits = c.visits.length
      const completedVisits = c.visits.filter((v) => v.status === 'COMPLETED').length
      const nextVisit = c.visits.find(
        (v) => v.status === 'SCHEDULED' && new Date(v.scheduledDate) >= today
      )
      const overdueVisits = c.visits.filter(
        (v) => v.status === 'SCHEDULED' && new Date(v.scheduledDate) < today
      ).length

      return {
        ...c,
        totalVisits,
        completedVisits,
        overdueVisits,
        nextVisitDate: nextVisit?.scheduledDate || null,
      }
    })

    return NextResponse.json({
      contracts: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/amc-contracts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
