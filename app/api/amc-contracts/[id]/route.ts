import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canViewAmcContracts, canManageAmcContracts } from '@/lib/permissions'
import type { UserWithRoles } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import {
  pauseAmcContract,
  resumeAmcContract,
  cancelAmcContract,
} from '@/lib/amc-scheduling'

// GET /api/amc-contracts/[id] - Get single AMC contract with visits
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = session.user as UserWithRoles
    if (!canViewAmcContracts(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const contract = await prisma.amcContract.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        client: true,
        quotation: {
          include: {
            items: { where: { deletedAt: null } },
            salesExecutive: { select: { id: true, code: true, name: true } },
          },
        },
        visits: {
          orderBy: { visitNumber: 'asc' },
          include: {
            jobOrder: {
              select: {
                id: true,
                jobNumber: true,
                status: true,
                paymentStatus: true,
              },
            },
          },
        },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error) {
    console.error(`GET /api/amc-contracts/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/amc-contracts/[id] - Pause, resume, or cancel
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
    if (!canManageAmcContracts(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reason } = body

    const existing = await prisma.amcContract.findUnique({
      where: { id: params.id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    let contract
    switch (action) {
      case 'pause':
        if (existing.status !== 'ACTIVE') {
          return NextResponse.json(
            { error: 'Only active contracts can be paused' },
            { status: 400 }
          )
        }
        contract = await pauseAmcContract(params.id)
        break

      case 'resume':
        if (existing.status !== 'PAUSED') {
          return NextResponse.json(
            { error: 'Only paused contracts can be resumed' },
            { status: 400 }
          )
        }
        contract = await resumeAmcContract(params.id)
        break

      case 'cancel':
        if (existing.status === 'CANCELLED' || existing.status === 'COMPLETED') {
          return NextResponse.json(
            { error: 'Contract is already cancelled or completed' },
            { status: 400 }
          )
        }
        contract = await cancelAmcContract(params.id, reason)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: pause, resume, or cancel' },
          { status: 400 }
        )
    }

    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'amc_contract',
      entityId: params.id,
      oldValues: { status: existing.status },
      newValues: { status: contract.status, action },
    })

    return NextResponse.json({ success: true, contract })
  } catch (error) {
    console.error(`PATCH /api/amc-contracts/${params.id} error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
