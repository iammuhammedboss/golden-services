import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const moveSchema = z.object({
  targetParentId: z.string().nullable(),
  newSortOrder: z.number().int(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; objectId: string } }
) {
  try {
    const { id: measurementId, objectId: draggedObjectId } = params
    const body = await req.json()
    const { targetParentId, newSortOrder } = moveSchema.parse(body)

    // --- Validation and Authorization (to be enhanced) ---
    // TODO: Add validation to ensure the user has permission to modify this measurement

    const result = await prisma.$transaction(async (tx) => {
      const draggedObject = await tx.measurementObject.findUnique({
        where: { id: draggedObjectId },
        include: { itemMaster: true },
      })

      if (!draggedObject) {
        throw new Error('Dragged item not found.')
      }

      // --- Nesting Rule Validation ---
      if (targetParentId) {
        const parentObject = await tx.measurementObject.findUnique({
          where: { id: targetParentId },
          include: { itemMaster: true },
        })
        if (!parentObject) {
          throw new Error('Target parent not found.')
        }

        const draggedItemType = draggedObject.itemMaster?.name || draggedObject.type
        const parentItemType = parentObject.itemMaster?.name || parentObject.type
        
        // Rule: Parent's allowedChildTypes must include dragged item's type
        if (parentObject.itemMaster && !parentObject.itemMaster.allowedChildTypes.includes(draggedItemType)) {
          throw new Error(`Cannot move "${draggedObject.name}" inside "${parentObject.name}". Nesting rule violation.`)
        }
        // Rule: Dragged item's allowedParentTypes must include parent's type
        if (draggedObject.itemMaster && !draggedObject.itemMaster.allowedParentTypes.includes(parentItemType)) {
          throw new Error(`Cannot move "${draggedObject.name}" inside "${parentObject.name}". Item rule violation.`)
        }

      } else { // Moving to root
        if (draggedObject.itemMaster && !draggedObject.itemMaster.canBeRootLevel) {
          throw new Error(`"${draggedObject.name}" cannot be a root-level item.`)
        }
      }
      // --- End Validation ---


      // Re-fetch within transaction for consistency
      const currentObject = await tx.measurementObject.findUniqueOrThrow({ where: { id: draggedObjectId }})
      const originalParentId = currentObject.parentObjectId

      // Update siblings in the old parent list
      if (originalParentId) {
        const oldSiblings = await tx.measurementObject.findMany({
          where: { parentObjectId: originalParentId, id: { not: draggedObjectId } },
          orderBy: { sortOrder: 'asc' },
        })
        await Promise.all(
          oldSiblings.map((s, i) =>
            tx.measurementObject.update({ where: { id: s.id }, data: { sortOrder: i } })
          )
        )
      }
      
      // Update siblings in the new parent list
      const newSiblings = await tx.measurementObject.findMany({
        where: { parentObjectId: targetParentId, id: { not: draggedObjectId } },
        orderBy: { sortOrder: 'asc' },
      })

      const updates = []
      for (let i = 0; i < newSiblings.length; i++) {
        if (i >= newSortOrder) {
          updates.push(tx.measurementObject.update({
            where: { id: newSiblings[i].id },
            data: { sortOrder: i + 1 },
          }))
        }
      }
      await Promise.all(updates)

      // Finally, update the dragged object itself
      const updatedObject = await tx.measurementObject.update({
        where: { id: draggedObjectId },
        data: {
          parentObjectId: targetParentId,
          sortOrder: newSortOrder,
        },
      })
      
      return updatedObject
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error moving object:', error)
    const message = error instanceof Error ? error.message : 'Failed to move object'
    return NextResponse.json(
      { error: message },
      { status: error instanceof z.ZodError ? 400 : 500 }
    )
  }
}