import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageQuotations, canViewQuotations } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { Decimal } from '@prisma/client/runtime/library'
import { createAuditLog } from '@/lib/audit'
import {
  validateQuotationData,
  isValidStatusTransition,
  getStatusTransitionError,
  canEditQuotation,
  canDeleteQuotation,
  calculateQuotationTotals,
} from '@/lib/quotation-validation'
import {
  validateMeasurementExists,
  validateTermsTemplateExists,
  validateBankDetailsTemplateExists,
  getTemplateSnapshots,
} from '@/lib/quotation-utils'
import type { QuotationStatus } from '@prisma/client'
import { createAmcContractFromQuotation } from '@/lib/amc-scheduling'

// GET /api/quotations/[id] - Get a single quotation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = session.user as UserWithRoles
  if (!canViewQuotations(currentUser)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: params.id,
        deletedAt: null, // Only return non-deleted quotations
      },
      include: {
        client: true,
        lead: true,
        items: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        salesExecutive: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
          },
        },
        measurement: {
          select: {
            id: true,
            title: true,
          },
        },
        termsTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
        bankDetailsTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
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

// PUT /api/quotations/[id] - Full update of quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = session.user as UserWithRoles
  if (!canManageQuotations(currentUser)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const {
      measurementId,
      salesExecutiveId,
      validUntil,
      notes,
      items,
      vatEnabled,
      vatPercentage,
      discountType,
      discountValue,
      termsTemplateId,
      bankDetailsTemplateId,
      isAmc,
      amcFrequency,
      amcDurationMonths,
      amcStartDate,
    } = body

    // Get existing quotation
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        items: {
          where: { deletedAt: null },
        },
      },
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // Check if quotation can be edited
    if (!canEditQuotation(existingQuotation.status)) {
      return NextResponse.json(
        {
          error: `Cannot edit quotation with status "${existingQuotation.status}". Only DRAFT quotations can be edited.`,
        },
        { status: 400 }
      )
    }

    // Validate quotation data
    const validation = validateQuotationData({
      clientId: existingQuotation.clientId, // Client cannot be changed
      items,
      discountType,
      discountValue,
      vatPercentage,
      validUntil,
    })

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // Validate referenced entities
    const [measurementExists, termsTemplateExists, bankDetailsTemplateExists] =
      await Promise.all([
        validateMeasurementExists(measurementId),
        validateTermsTemplateExists(termsTemplateId),
        validateBankDetailsTemplateExists(bankDetailsTemplateId),
      ])

    if (measurementId && !measurementExists) {
      return NextResponse.json(
        { error: 'Measurement not found' },
        { status: 404 }
      )
    }

    if (termsTemplateId && !termsTemplateExists) {
      return NextResponse.json(
        { error: 'Terms template not found' },
        { status: 404 }
      )
    }

    if (bankDetailsTemplateId && !bankDetailsTemplateExists) {
      return NextResponse.json(
        { error: 'Bank details template not found' },
        { status: 404 }
      )
    }

    // Get template snapshots if templates changed
    const templateSnapshots = await getTemplateSnapshots({
      termsTemplateId,
      bankDetailsTemplateId,
    })

    // Update quotation in transaction
    const updatedQuotation = await prisma.$transaction(async (tx) => {
      // Soft delete old items
      await tx.quotationItem.updateMany({
        where: {
          quotationId: params.id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedById: currentUser.id,
        },
      })

      // Update quotation and create new items
      const updated = await tx.quotation.update({
        where: { id: params.id },
        data: {
          measurementId: measurementId || null,
          salesExecutiveId: salesExecutiveId || null,
          validUntil: validUntil ? new Date(validUntil) : null,
          notes: notes || null,
          isAmc: isAmc || false,
          amcFrequency: isAmc ? amcFrequency : null,
          amcDurationMonths: isAmc ? amcDurationMonths : null,
          amcStartDate: isAmc && amcStartDate ? new Date(amcStartDate) : null,
          vatEnabled: vatEnabled || false,
          vatPercentage: vatEnabled
            ? new Decimal(vatPercentage || 5)
            : new Decimal(0),
          discountType: discountType || null,
          discountValue: discountValue ? new Decimal(discountValue) : null,
          termsTemplateId: termsTemplateId || null,
          termsSnapshot: templateSnapshots.termsSnapshot || existingQuotation.termsSnapshot,
          bankDetailsTemplateId: bankDetailsTemplateId || null,
          bankDetailsSnapshot: templateSnapshots.bankDetailsSnapshot || existingQuotation.bankDetailsSnapshot,
          items: {
            create: items.map((item: any) => {
              const quantity = new Decimal(item.quantity)
              const unitPrice = new Decimal(item.unitPrice || 0)
              const total = quantity.times(unitPrice)

              return {
                serviceId: item.serviceId || null,
                description: item.description.trim(),
                quantity,
                unit: item.unit,
                unitPrice,
                total,
                optionGroup: item.optionGroup || null,
              }
            }),
          },
        },
        include: {
          items: {
            where: {
              deletedAt: null,
            },
          },
          client: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          salesExecutive: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      })

      // Create audit log
      await createAuditLog({
        userId: currentUser.id,
        action: 'UPDATE',
        entityType: 'quotation',
        entityId: params.id,
        oldValues: {
          items: existingQuotation.items.length,
          total: calculateQuotationTotals({
            items: existingQuotation.items,
            discountType: existingQuotation.discountType,
            discountValue: existingQuotation.discountValue,
            vatEnabled: existingQuotation.vatEnabled,
            vatPercentage: existingQuotation.vatPercentage,
          }).total.toFixed(3),
        },
        newValues: {
          items: updated.items.length,
          total: calculateQuotationTotals({
            items: updated.items,
            discountType: updated.discountType,
            discountValue: updated.discountValue,
            vatEnabled: updated.vatEnabled,
            vatPercentage: updated.vatPercentage,
          }).total.toFixed(3),
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      quotation: updatedQuotation,
    })
  } catch (error) {
    console.error(`Error updating quotation ${params.id}:`, error)
    return NextResponse.json(
      {
        error: 'Failed to update quotation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/quotations/[id] - Partial update (status, notes, validUntil)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as UserWithRoles

    if (!canManageQuotations(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, validUntil, notes } = body

    // Get existing quotation (include isAmc to check for AMC contract creation)
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // Validate status transition if status is being changed
    if (status && status !== existingQuotation.status) {
      if (!isValidStatusTransition(existingQuotation.status, status as QuotationStatus)) {
        const errorMessage = getStatusTransitionError(
          existingQuotation.status,
          status as QuotationStatus
        )
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (status) updateData.status = status
    if (validUntil !== undefined) {
      updateData.validUntil = validUntil ? new Date(validUntil) : null
    }
    if (notes !== undefined) updateData.notes = notes

    // Update quotation
    const quotation = await prisma.$transaction(async (tx) => {
      const updated = await tx.quotation.update({
        where: { id: params.id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          lead: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          items: {
            where: {
              deletedAt: null,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          salesExecutive: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      })

      // Create audit log
      const changes: any = {}
      if (status && status !== existingQuotation.status) {
        changes.status = { from: existingQuotation.status, to: status }
      }
      if (validUntil !== undefined && validUntil !== existingQuotation.validUntil) {
        changes.validUntil = { from: existingQuotation.validUntil, to: validUntil }
      }
      if (notes !== undefined && notes !== existingQuotation.notes) {
        changes.notes = { from: existingQuotation.notes, to: notes }
      }

      await createAuditLog({
        userId: currentUser.id,
        action: 'UPDATE',
        entityType: 'quotation',
        entityId: params.id,
        oldValues: {
          status: existingQuotation.status,
          validUntil: existingQuotation.validUntil,
          notes: existingQuotation.notes,
        },
        newValues: changes,
      })

      return updated
    })

    // If quotation is now ACCEPTED and is an AMC, create the AMC contract
    if (
      status === 'ACCEPTED' &&
      existingQuotation.status !== 'ACCEPTED' &&
      quotation.isAmc
    ) {
      try {
        await createAmcContractFromQuotation(params.id, currentUser.id)
      } catch (amcError) {
        console.error('Failed to create AMC contract:', amcError)
        // Don't fail the status update, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      quotation,
    })
  } catch (error) {
    console.error('PATCH /api/quotations/[id] error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/quotations/[id] - Soft delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentUser = session.user as UserWithRoles
  if (!canManageQuotations(currentUser)) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    // Get existing quotation
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // Check if quotation can be deleted
    if (!canDeleteQuotation(existingQuotation.status)) {
      return NextResponse.json(
        {
          error: `Cannot delete quotation with status "${existingQuotation.status}". Only DRAFT quotations can be deleted.`,
        },
        { status: 400 }
      )
    }

    // Soft delete quotation and its items
    await prisma.$transaction(async (tx) => {
      // Soft delete items
      await tx.quotationItem.updateMany({
        where: {
          quotationId: params.id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          deletedById: currentUser.id,
        },
      })

      // Soft delete quotation
      await tx.quotation.update({
        where: { id: params.id },
        data: {
          deletedAt: new Date(),
          deletedById: currentUser.id,
        },
      })

      // Create audit log
      await createAuditLog({
        userId: currentUser.id,
        action: 'DELETE',
        entityType: 'quotation',
        entityId: params.id,
        oldValues: {
          quotationNumber: existingQuotation.quotationNumber,
          status: existingQuotation.status,
        },
        newValues: null,
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Quotation deleted successfully',
    })
  } catch (error) {
    console.error(`Error deleting quotation ${params.id}:`, error)
    return NextResponse.json(
      {
        error: 'Failed to delete quotation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
