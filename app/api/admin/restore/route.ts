import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canRestoreRecords } from '@/lib/permissions'
import { restoreRecord } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import type { UserWithRoles } from '@/lib/permissions'

// POST /api/admin/restore - Restore a deleted record (OWNER only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canRestoreRecords(user)) {
      return NextResponse.json(
        { error: 'Forbidden: Owner access required to restore records' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { entityType, entityId } = body

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    // Map entity types to Prisma models
    const entityModelMap: Record<string, any> = {
      ItemTypeMaster: prisma.itemTypeMaster,
      SofaTypeMaster: prisma.sofaTypeMaster,
      WindowSizeMaster: prisma.windowSizeMaster,
      RoomTypeMaster: prisma.roomTypeMaster,
      PaymentMethodMaster: prisma.paymentMethodMaster,
      Lead: prisma.lead,
      Client: prisma.client,
      Site: prisma.site,
      SiteVisit: prisma.siteVisit,
      Room: prisma.room,
      RoomItem: prisma.roomItem,
      Quotation: prisma.quotation,
      QuotationItem: prisma.quotationItem,
      JobOrder: prisma.jobOrder,
      ChecklistItem: prisma.checklistItem,
      Invoice: prisma.invoice,
      InvoiceItem: prisma.invoiceItem,
      Payment: prisma.payment,
      Photo: prisma.photo,
      User: prisma.user,
    }

    const model = entityModelMap[entityType]

    if (!model) {
      return NextResponse.json(
        { error: `Invalid entity type: ${entityType}` },
        { status: 400 }
      )
    }

    // Check if record exists and is deleted
    const record = await model.findUnique({
      where: { id: entityId },
    })

    if (!record) {
      return NextResponse.json(
        { error: `${entityType} not found` },
        { status: 404 }
      )
    }

    if (!record.deletedAt) {
      return NextResponse.json(
        { error: `${entityType} is not deleted` },
        { status: 400 }
      )
    }

    // Restore the record by clearing deletedAt and deletedById
    const restored = await model.update({
      where: { id: entityId },
      data: {
        deletedAt: null,
        deletedById: null,
      },
    })

    // Create audit log for restoration
    await restoreRecord(entityType, entityId, user.id)

    return NextResponse.json({
      message: `${entityType} restored successfully`,
      data: restored,
    })
  } catch (error) {
    console.error('POST /api/admin/restore error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
