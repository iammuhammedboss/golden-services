import { prisma } from '@/lib/prisma'
import { MeasurementObjectType } from '@prisma/client'

/**
 * Nesting validation for measurement objects
 *
 * Rules:
 * - Property types can be at root level
 * - Spaces/rooms must be under properties
 * - Items can be under properties or spaces
 * - OTHER/CUSTOM types bypass all restrictions
 */

// Types that bypass all nesting restrictions
const FLEXIBLE_TYPES: MeasurementObjectType[] = ['CUSTOM', 'OTHER', 'ITEM']

export async function validateNesting(
  itemMasterId: string | null,
  type: MeasurementObjectType,
  parentObjectId: string | null
): Promise<{ valid: boolean; error?: string }> {
  // CUSTOM, OTHER, and ITEM types bypass all restrictions
  if (FLEXIBLE_TYPES.includes(type)) {
    return { valid: true }
  }

  // If no itemMasterId, we can't validate nesting rules
  if (!itemMasterId) {
    // For now, allow it but this should ideally have catalog item
    return { valid: true }
  }

  // Get the catalog item with nesting rules
  const catalogItem = await prisma.itemMaster.findUnique({
    where: { id: itemMasterId },
    select: {
      name: true,
      canBeRootLevel: true,
      allowedParentTypes: true,
      allowedChildTypes: true,
    },
  })

  if (!catalogItem) {
    return { valid: false, error: 'Invalid catalog item' }
  }

  // Check if trying to create at root level
  if (!parentObjectId) {
    if (!catalogItem.canBeRootLevel) {
      return {
        valid: false,
        error: `${catalogItem.name} cannot be at root level. It must have a parent.`,
      }
    }
    return { valid: true }
  }

  // Get the parent object
  const parentObject = await prisma.measurementObject.findUnique({
    where: { id: parentObjectId },
    select: {
      type: true,
      itemMasterId: true,
      itemMaster: {
        select: {
          name: true,
          allowedChildTypes: true,
        },
      },
    },
  })

  if (!parentObject) {
    return { valid: false, error: 'Parent object not found' }
  }

  // If parent is a flexible type, allow anything
  if (FLEXIBLE_TYPES.includes(parentObject.type)) {
    return { valid: true }
  }

  // Check if parent allows this child type
  if (
    parentObject.itemMaster &&
    parentObject.itemMaster.allowedChildTypes.length > 0
  ) {
    const childTypeString = type.toString()
    if (!parentObject.itemMaster.allowedChildTypes.includes(childTypeString)) {
      return {
        valid: false,
        error: `${parentObject.itemMaster.name} cannot contain ${catalogItem.name}`,
      }
    }
  }

  // Check if this item allows the parent type
  if (catalogItem.allowedParentTypes.length > 0) {
    const parentTypeString = parentObject.type.toString()
    if (!catalogItem.allowedParentTypes.includes(parentTypeString)) {
      return {
        valid: false,
        error: `${catalogItem.name} cannot be under ${parentObject.type}`,
      }
    }
  }

  return { valid: true }
}

/**
 * Recursively soft delete a measurement object and all its children
 */
export async function softDeleteObjectTree(
  objectId: string,
  deletedById: string
): Promise<void> {
  // Get all children recursively
  const children = await prisma.measurementObject.findMany({
    where: { parentObjectId: objectId, deletedAt: null },
    select: { id: true },
  })

  // Recursively delete children first
  for (const child of children) {
    await softDeleteObjectTree(child.id, deletedById)
  }

  // Delete the object itself
  await prisma.measurementObject.update({
    where: { id: objectId },
    data: {
      deletedAt: new Date(),
      deletedById,
    },
  })
}

/**
 * Recursively duplicate a measurement object and all its children
 */
export async function duplicateObjectTree(
  objectId: string,
  measurementId: string,
  parentObjectId: string | null = null
): Promise<any> {
  // Get the source object with all relations
  const sourceObject = await prisma.measurementObject.findUnique({
    where: { id: objectId },
    include: {
      stains: true,
      areasOfNotice: true,
      media: true,
      children: {
        where: { deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!sourceObject) {
    throw new Error('Source object not found')
  }

  // Create the duplicate object
  const duplicateObject = await prisma.measurementObject.create({
    data: {
      measurementId,
      parentObjectId,
      type: sourceObject.type,
      name: `${sourceObject.name} (Copy)`,
      itemMasterId: sourceObject.itemMasterId,
      sizeMode: sourceObject.sizeMode,
      size: sourceObject.size,
      dimensionLength: sourceObject.dimensionLength,
      dimensionWidth: sourceObject.dimensionWidth,
      dimensionHeight: sourceObject.dimensionHeight,
      dimensionUnit: sourceObject.dimensionUnit,
      dirtLevel: sourceObject.dirtLevel,
      quantity: sourceObject.quantity,
      notes: sourceObject.notes,
      remarks: sourceObject.remarks,
      sortOrder: sourceObject.sortOrder,
      // Duplicate relations
      stains: {
        create: sourceObject.stains.map((stain) => ({
          description: stain.description,
          notes: stain.notes,
          photoUrl: stain.photoUrl,
        })),
      },
      areasOfNotice: {
        create: sourceObject.areasOfNotice.map((area) => ({
          description: area.description,
          notes: area.notes,
          photoUrl: area.photoUrl,
        })),
      },
      media: {
        create: sourceObject.media.map((m) => ({
          type: m.type,
          url: m.url,
          thumbnailUrl: m.thumbnailUrl,
          duration: m.duration,
          caption: m.caption,
          sortOrder: m.sortOrder,
        })),
      },
    },
  })

  // Recursively duplicate children
  for (const child of sourceObject.children) {
    await duplicateObjectTree(child.id, measurementId, duplicateObject.id)
  }

  return duplicateObject
}
