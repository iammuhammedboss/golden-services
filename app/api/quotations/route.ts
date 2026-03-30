import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageQuotations, canViewQuotations } from '@/lib/permissions'
import { Decimal } from '@prisma/client/runtime/library'
import { createAuditLog } from '@/lib/audit'
import {
  validateQuotationData,
  calculateQuotationTotals,
} from '@/lib/quotation-validation'
import {
  generateQuotationNumber,
  getNextQuotationVersion,
  validateMeasurementExists,
  validateClientExists,
  validateTermsTemplateExists,
  validateBankDetailsTemplateExists,
  getTemplateSnapshots,
} from '@/lib/quotation-utils'

// GET /api/quotations - List all quotations with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as any
    if (!canViewQuotations(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {
      deletedAt: null, // Exclude soft-deleted quotations
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get quotations and total count
    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          quotationNumber: true,
          status: true,
          validUntil: true,
          clientId: true,
          createdAt: true,
          vatEnabled: true,
          vatPercentage: true,
          discountType: true,
          discountValue: true,
          isAmc: true,
          client: {
            select: {
              name: true,
            },
          },
          createdBy: {
            select: {
              name: true,
            },
          },
          items: {
            where: {
              deletedAt: null,
            },
            select: {
              quantity: true,
              unitPrice: true,
            },
          },
        },
      }),
      prisma.quotation.count({ where }),
    ])

    // Calculate totals for each quotation
    const quotationsWithTotals = quotations.map((quotation) => {
      const totals = calculateQuotationTotals({
        items: quotation.items,
        discountType: quotation.discountType,
        discountValue: quotation.discountValue,
        vatEnabled: quotation.vatEnabled,
        vatPercentage: quotation.vatPercentage,
      })

      return {
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        status: quotation.status,
        validUntil: quotation.validUntil,
        clientId: quotation.clientId,
        createdAt: quotation.createdAt,
        isAmc: quotation.isAmc,
        client: quotation.client,
        createdBy: quotation.createdBy,
        total: totals.total.toFixed(3),
      }
    })

    return NextResponse.json({
      quotations: quotationsWithTotals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/quotations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/quotations - Create a new quotation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage quotations
    const currentUser = session.user as any
    if (!canManageQuotations(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      clientId,
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
      leadId,
      isAmc,
      amcFrequency,
      amcDurationMonths,
      amcStartDate,
    } = body

    // Validate quotation data
    const validation = validateQuotationData({
      clientId,
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

    // Validate that referenced entities exist
    const [clientExists, measurementExists, termsTemplateExists, bankDetailsTemplateExists] =
      await Promise.all([
        validateClientExists(clientId),
        validateMeasurementExists(measurementId),
        validateTermsTemplateExists(termsTemplateId),
        validateBankDetailsTemplateExists(bankDetailsTemplateId),
      ])

    if (!clientExists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

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

    // Generate quotation number and get version
    const [quotationNumber, version, templateSnapshots] = await Promise.all([
      generateQuotationNumber(),
      getNextQuotationVersion(clientId),
      getTemplateSnapshots({ termsTemplateId, bankDetailsTemplateId }),
    ])

    // Create quotation with items in a transaction
    const quotation = await prisma.$transaction(async (tx) => {
      const newQuotation = await tx.quotation.create({
        data: {
          quotationNumber,
          clientId,
          measurementId: measurementId || null,
          salesExecutiveId: salesExecutiveId || null,
          version,
          createdById: currentUser.id,
          status: 'DRAFT',
          validUntil: validUntil ? new Date(validUntil) : null,
          notes: notes || null,
          vatEnabled: vatEnabled || false,
          vatPercentage: vatEnabled
            ? new Decimal(vatPercentage || 5)
            : new Decimal(0),
          discountType: discountType || null,
          discountValue: discountValue ? new Decimal(discountValue) : null,
          termsTemplateId: termsTemplateId || null,
          termsSnapshot: templateSnapshots.termsSnapshot,
          bankDetailsTemplateId: bankDetailsTemplateId || null,
          bankDetailsSnapshot: templateSnapshots.bankDetailsSnapshot,
          leadId: leadId || null,
          isAmc: isAmc || false,
          amcFrequency: isAmc ? amcFrequency : null,
          amcDurationMonths: isAmc ? amcDurationMonths : null,
          amcStartDate: isAmc && amcStartDate ? new Date(amcStartDate) : null,
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
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
            },
          },
        },
      })

      // Create audit log
      await createAuditLog({
        userId: currentUser.id,
        action: 'CREATE',
        entityType: 'quotation',
        entityId: newQuotation.id,
        newValues: {
          quotationNumber: newQuotation.quotationNumber,
          clientId: newQuotation.clientId,
          status: newQuotation.status,
          total: calculateQuotationTotals({
            items: newQuotation.items,
            discountType: newQuotation.discountType,
            discountValue: newQuotation.discountValue,
            vatEnabled: newQuotation.vatEnabled,
            vatPercentage: newQuotation.vatPercentage,
          }).total.toFixed(3),
        },
      })

      return newQuotation
    })

    return NextResponse.json({
      success: true,
      quotation,
    })
  } catch (error) {
    console.error('POST /api/quotations error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create quotation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
