import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageMasters } from '@/lib/permissions'
import { createAuditLog, softDelete } from '@/lib/audit'
import type { UserWithRoles } from '@/lib/permissions'

// GET /api/masters/materials/[id] - Get single material
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const material = await prisma.materialMaster.findUnique({
      where: { id: params.id },
    })

    if (!material || material.deletedAt) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error('GET /api/masters/materials/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/masters/materials/[id] - Update material (OWNER only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageMasters(user)) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 })
    }

    const existingMaterial = await prisma.materialMaster.findUnique({
      where: { id: params.id },
    })

    if (!existingMaterial || existingMaterial.deletedAt) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, description, isActive } = body

    // Check for duplicate name if name is being changed
    if (name && name !== existingMaterial.name) {
      const duplicate = await prisma.materialMaster.findFirst({
        where: {
          name,
          id: { not: params.id },
          deletedAt: null,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Material with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    const material = await prisma.materialMaster.update({
      where: { id: params.id },
      data: updateData,
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: 'MaterialMaster',
      entityId: material.id,
      oldValues: existingMaterial,
      newValues: material,
    })

    return NextResponse.json(material)
  } catch (error) {
    console.error('PATCH /api/masters/materials/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/masters/materials/[id] - Soft delete material (OWNER only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as UserWithRoles

    if (!canManageMasters(user)) {
      return NextResponse.json({ error: 'Forbidden: Owner access required' }, { status: 403 })
    }

    const material = await prisma.materialMaster.findUnique({
      where: { id: params.id },
    })

    if (!material || material.deletedAt) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Soft delete: Update deletedAt and deletedById
    const deleted = await prisma.materialMaster.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
      },
    })

    // Create deleted record snapshot
    await softDelete('MaterialMaster', params.id, user.id, material)

    return NextResponse.json({ message: 'Material deleted successfully', data: deleted })
  } catch (error) {
    console.error('DELETE /api/masters/materials/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
