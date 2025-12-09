import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageQuotations } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        items: true,
      },
    })

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error(`Error fetching quotation ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    )
  }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id:string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles
    if (!canManageQuotations(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { items, ...quotationData } = body

        const updatedQuotation = await prisma.$transaction(async (prisma) => {
            const quotation = await prisma.quotation.update({
                where: { id: params.id },
                data: quotationData,
            })

            if (items) {
                await prisma.quotationItem.deleteMany({
                    where: { quotationId: params.id },
                })

                await prisma.quotationItem.createMany({
                    data: items.map((item: any) => ({
                        ...item,
                        quotationId: params.id,
                        quantity: new Decimal(item.quantity),
                        unitPrice: new Decimal(item.unitPrice),
                        total: new Decimal(item.total),
                    })),
                })
            }

            return quotation
        })

        return NextResponse.json(updatedQuotation)
    } catch (error) {
        console.error(`Error updating quotation ${params.id}:`, error)
        return NextResponse.json(
            { error: 'Failed to update quotation' },
            { status: 500 }
        )
    }
}