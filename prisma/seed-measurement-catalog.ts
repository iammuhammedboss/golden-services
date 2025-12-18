import { PrismaClient, MeasurementObjectType } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Phase 2: Measurement Catalog + Nesting Rules
 *
 * This seed creates a comprehensive catalog of measurement items with proper nesting rules.
 *
 * Nesting Rules:
 * - Property types (Villa, House, Flat) can be at root level
 * - Property types can contain spaces/rooms and items directly
 * - Spaces/rooms can contain items
 * - Items can be nested under items in some cases
 * - OTHER/CUSTOM types bypass all restrictions
 */

async function seedMeasurementCatalog() {
  console.log('🌱 Seeding measurement catalog with nesting rules...')

  // Get or create default unit
  const pieceUnit = await prisma.unitMaster.upsert({
    where: { name: 'Piece' },
    update: {},
    create: { name: 'Piece', description: 'Individual item' },
  })

  const sqmUnit = await prisma.unitMaster.upsert({
    where: { name: 'Sq Meter' },
    update: {},
    create: { name: 'Sq Meter', description: 'Square meter' },
  })

  // Define Property Types
  const propertyTypes: MeasurementObjectType[] = [
    'HOUSE',
    'VILLA',
    'FLAT',
    'APARTMENT',
    'OFFICE',
    'WAREHOUSE',
    'SHOP',
  ]

  // Define Space/Room Types
  const spaceTypes: MeasurementObjectType[] = [
    'ROOM',
    'BEDROOM',
    'KITCHEN',
    'TOILET',
    'BATHROOM',
    'HALL',
    'LIVING_ROOM',
    'DINING_ROOM',
    'PASSAGE',
    'CORRIDOR',
    'BALCONY',
    'TERRACE',
    'STAIRCASE',
    'GARAGE',
    'STORAGE_ROOM',
    'LAUNDRY_ROOM',
  ]

  // Define Item Types (Furniture, Fixtures, Appliances, etc.)
  const itemTypes: MeasurementObjectType[] = [
    // Furniture
    'SOFA',
    'CHAIR',
    'TABLE',
    'BED',
    'WARDROBE',
    'CABINET',
    'SHELF',
    'DESK',
    'DRESSER',
    // Fixtures
    'DOOR',
    'WINDOW',
    'CURTAIN',
    'BLIND',
    'MIRROR',
    'LIGHT_FIXTURE',
    // Appliances
    'AC_UNIT',
    'REFRIGERATOR',
    'WASHING_MACHINE',
    'DISHWASHER',
    'OVEN',
    'MICROWAVE',
    'TV',
    // Floor & Wall
    'CARPET',
    'RUG',
    'MAT',
    'TILE',
    'WALLPAPER',
  ]

  // Define Outdoor Types
  const outdoorTypes: MeasurementObjectType[] = [
    'GARDEN',
    'POOL',
    'PATIO',
    'FENCE',
    'GATE',
  ]

  // Catalog items with nesting rules
  const catalogItems = [
    // ============================================
    // PROPERTY TYPES (Root Level)
    // ============================================
    {
      name: 'House',
      category: 'Property',
      unitId: pieceUnit.id,
      canBeRootLevel: true,
      allowedParentTypes: [], // Cannot be nested
      allowedChildTypes: [...spaceTypes.map(String), ...itemTypes.map(String), ...outdoorTypes.map(String)],
      description: 'Standalone house',
      sortOrder: 1,
    },
    {
      name: 'Villa',
      category: 'Property',
      unitId: pieceUnit.id,
      canBeRootLevel: true,
      allowedParentTypes: [],
      allowedChildTypes: [...spaceTypes.map(String), ...itemTypes.map(String), ...outdoorTypes.map(String)],
      description: 'Villa or luxury residence',
      sortOrder: 2,
    },
    {
      name: 'Flat',
      category: 'Property',
      unitId: pieceUnit.id,
      canBeRootLevel: true,
      allowedParentTypes: [],
      allowedChildTypes: [...spaceTypes.map(String), ...itemTypes.map(String)],
      description: 'Flat or apartment unit',
      sortOrder: 3,
    },
    {
      name: 'Apartment',
      category: 'Property',
      unitId: pieceUnit.id,
      canBeRootLevel: true,
      allowedParentTypes: [],
      allowedChildTypes: [...spaceTypes.map(String), ...itemTypes.map(String)],
      description: 'Apartment unit',
      sortOrder: 4,
    },
    {
      name: 'Office',
      category: 'Property',
      unitId: sqmUnit.id,
      canBeRootLevel: true,
      allowedParentTypes: [],
      allowedChildTypes: [...spaceTypes.map(String), ...itemTypes.map(String)],
      description: 'Office space',
      sortOrder: 5,
    },
    {
      name: 'Warehouse',
      category: 'Property',
      unitId: sqmUnit.id,
      canBeRootLevel: true,
      allowedParentTypes: [],
      allowedChildTypes: [...spaceTypes.map(String), ...itemTypes.map(String)],
      description: 'Warehouse or storage facility',
      sortOrder: 6,
    },
    {
      name: 'Shop',
      category: 'Property',
      unitId: sqmUnit.id,
      canBeRootLevel: true,
      allowedParentTypes: [],
      allowedChildTypes: [...spaceTypes.map(String), ...itemTypes.map(String)],
      description: 'Retail shop or store',
      sortOrder: 7,
    },

    // ============================================
    // SPACE/ROOM TYPES
    // ============================================
    {
      name: 'Room',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Generic room',
      sortOrder: 10,
    },
    {
      name: 'Bedroom',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Bedroom',
      sortOrder: 11,
    },
    {
      name: 'Kitchen',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Kitchen',
      sortOrder: 12,
    },
    {
      name: 'Toilet',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Toilet',
      sortOrder: 13,
    },
    {
      name: 'Bathroom',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Bathroom',
      sortOrder: 14,
    },
    {
      name: 'Hall',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Hall or reception area',
      sortOrder: 15,
    },
    {
      name: 'Living Room',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Living room',
      sortOrder: 16,
    },
    {
      name: 'Dining Room',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Dining room',
      sortOrder: 17,
    },
    {
      name: 'Passage',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Passage or walkway',
      sortOrder: 18,
    },
    {
      name: 'Corridor',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Corridor or hallway',
      sortOrder: 19,
    },
    {
      name: 'Balcony',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Balcony',
      sortOrder: 20,
    },
    {
      name: 'Terrace',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Terrace or rooftop',
      sortOrder: 21,
    },
    {
      name: 'Staircase',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Staircase',
      sortOrder: 22,
    },
    {
      name: 'Garage',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Garage or parking area',
      sortOrder: 23,
    },
    {
      name: 'Storage Room',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Storage room',
      sortOrder: 24,
    },
    {
      name: 'Laundry Room',
      category: 'Space',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Laundry room',
      sortOrder: 25,
    },

    // ============================================
    // FURNITURE
    // ============================================
    {
      name: 'Sofa',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Sofa or couch',
      sortOrder: 30,
      defaultPrice: '3.000',
      requiresPhotos: true,
      tags: ['fabric', 'leather', 'upholstery'],
    },
    {
      name: 'Chair',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Chair or seat',
      sortOrder: 31,
      defaultPrice: '1.500',
      tags: ['seating'],
    },
    {
      name: 'Table',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Table or desk',
      sortOrder: 32,
      defaultPrice: '2.000',
      tags: ['wood', 'glass'],
    },
    {
      name: 'Bed',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Bed frame',
      sortOrder: 33,
      defaultPrice: '5.000',
      requiresPhotos: true,
      tags: ['bedroom'],
    },
    {
      name: 'Wardrobe',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Wardrobe or closet',
      sortOrder: 34,
      defaultPrice: '8.000',
      tags: ['storage', 'wood'],
    },
    {
      name: 'Cabinet',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Cabinet or cupboard',
      sortOrder: 35,
      defaultPrice: '4.000',
      tags: ['storage'],
    },
    {
      name: 'Shelf',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Shelf or bookcase',
      sortOrder: 36,
      defaultPrice: '2.500',
      tags: ['storage'],
    },
    {
      name: 'Desk',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Desk or work table',
      sortOrder: 37,
      defaultPrice: '3.500',
      tags: ['office', 'study'],
    },
    {
      name: 'Dresser',
      category: 'Furniture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Dresser or chest of drawers',
      sortOrder: 38,
      defaultPrice: '4.500',
      tags: ['bedroom', 'storage'],
    },

    // ============================================
    // FIXTURES
    // ============================================
    {
      name: 'Door',
      category: 'Fixture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Door',
      sortOrder: 40,
      defaultPrice: '3.000',
      tags: ['wood', 'metal'],
    },
    {
      name: 'Window',
      category: 'Fixture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Window',
      sortOrder: 41,
      defaultPrice: '2.000',
      tags: ['glass'],
    },
    {
      name: 'Curtain',
      category: 'Fixture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Curtain or drape',
      sortOrder: 42,
      defaultPrice: '4.000',
      requiresPhotos: true,
      tags: ['fabric', 'window'],
    },
    {
      name: 'Blind',
      category: 'Fixture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Window blind',
      sortOrder: 43,
      defaultPrice: '3.500',
      tags: ['window'],
    },
    {
      name: 'Mirror',
      category: 'Fixture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Mirror',
      sortOrder: 44,
      defaultPrice: '2.500',
      tags: ['glass'],
    },
    {
      name: 'Light Fixture',
      category: 'Fixture',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Light fixture or chandelier',
      sortOrder: 45,
      defaultPrice: '5.000',
      tags: ['lighting'],
    },

    // ============================================
    // APPLIANCES
    // ============================================
    {
      name: 'AC Unit',
      category: 'Appliance',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Air conditioning unit',
      sortOrder: 50,
      defaultPrice: '12.000',
      requiresPhotos: true,
      tags: ['hvac'],
    },
    {
      name: 'Refrigerator',
      category: 'Appliance',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Refrigerator or fridge',
      sortOrder: 51,
      defaultPrice: '10.000',
      tags: ['kitchen'],
    },
    {
      name: 'Washing Machine',
      category: 'Appliance',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Washing machine',
      sortOrder: 52,
      defaultPrice: '8.000',
      tags: ['laundry'],
    },
    {
      name: 'Dishwasher',
      category: 'Appliance',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Dishwasher',
      sortOrder: 53,
      defaultPrice: '7.000',
      tags: ['kitchen'],
    },
    {
      name: 'Oven',
      category: 'Appliance',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Oven or range',
      sortOrder: 54,
      defaultPrice: '9.000',
      tags: ['kitchen'],
    },
    {
      name: 'Microwave',
      category: 'Appliance',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Microwave oven',
      sortOrder: 55,
      defaultPrice: '4.000',
      tags: ['kitchen'],
    },
    {
      name: 'TV',
      category: 'Appliance',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Television',
      sortOrder: 56,
      defaultPrice: '8.000',
      requiresPhotos: true,
      tags: ['electronics'],
    },

    // ============================================
    // FLOOR & WALL
    // ============================================
    {
      name: 'Carpet',
      category: 'Floor & Wall',
      unitId: sqmUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Carpet',
      sortOrder: 60,
      defaultPrice: '1.500',
      requiresPhotos: true,
      tags: ['textile', 'flooring'],
    },
    {
      name: 'Rug',
      category: 'Floor & Wall',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Area rug',
      sortOrder: 61,
      defaultPrice: '2.500',
      requiresPhotos: true,
      tags: ['textile', 'flooring'],
    },
    {
      name: 'Mat',
      category: 'Floor & Wall',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Floor mat',
      sortOrder: 62,
      defaultPrice: '2.000',
      tags: ['flooring'],
    },
    {
      name: 'Tile',
      category: 'Floor & Wall',
      unitId: sqmUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Floor or wall tiles',
      sortOrder: 63,
      defaultPrice: '0.500',
      tags: ['flooring', 'wall'],
    },
    {
      name: 'Wallpaper',
      category: 'Floor & Wall',
      unitId: sqmUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: [...propertyTypes.map(String), ...spaceTypes.map(String)],
      allowedChildTypes: [],
      description: 'Wallpaper',
      sortOrder: 64,
      defaultPrice: '1.000',
      tags: ['wall'],
    },

    // ============================================
    // OUTDOOR
    // ============================================
    {
      name: 'Garden',
      category: 'Outdoor',
      unitId: sqmUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: [],
      description: 'Garden area',
      sortOrder: 70,
      defaultPrice: '10.000',
      tags: ['outdoor', 'landscaping'],
    },
    {
      name: 'Pool',
      category: 'Outdoor',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: [],
      description: 'Swimming pool',
      sortOrder: 71,
      defaultPrice: '50.000',
      requiresPhotos: true,
      tags: ['outdoor', 'water'],
    },
    {
      name: 'Patio',
      category: 'Outdoor',
      unitId: sqmUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: itemTypes.map(String),
      description: 'Patio or deck',
      sortOrder: 72,
      defaultPrice: '15.000',
      tags: ['outdoor'],
    },
    {
      name: 'Fence',
      category: 'Outdoor',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: [],
      description: 'Fence or boundary',
      sortOrder: 73,
      defaultPrice: '5.000',
      tags: ['outdoor'],
    },
    {
      name: 'Gate',
      category: 'Outdoor',
      unitId: pieceUnit.id,
      canBeRootLevel: false,
      allowedParentTypes: propertyTypes.map(String),
      allowedChildTypes: [],
      description: 'Entry gate',
      sortOrder: 74,
      defaultPrice: '8.000',
      tags: ['outdoor', 'metal'],
    },

    // ============================================
    // GENERIC/CUSTOM (Bypass all restrictions)
    // ============================================
    {
      name: 'Other Item',
      category: 'Generic',
      unitId: pieceUnit.id,
      canBeRootLevel: true, // Can be anywhere
      allowedParentTypes: [], // Empty means no restriction
      allowedChildTypes: [], // Can contain anything (enforced in backend logic)
      description: 'Generic item',
      sortOrder: 90,
      tags: ['generic'],
    },
    {
      name: 'Other',
      category: 'Generic',
      unitId: pieceUnit.id,
      canBeRootLevel: true, // Can be anywhere
      allowedParentTypes: [], // Empty means no restriction
      allowedChildTypes: [], // Can contain anything (enforced in backend logic)
      description: 'Other uncategorized item',
      sortOrder: 91,
      tags: ['generic'],
    },
    {
      name: 'Custom',
      category: 'Generic',
      unitId: pieceUnit.id,
      canBeRootLevel: true, // Can be anywhere
      allowedParentTypes: [], // Empty means no restriction
      allowedChildTypes: [], // Can contain anything (enforced in backend logic)
      description: 'Custom user-defined item',
      sortOrder: 92,
      tags: ['custom'],
    },
  ]

  // Create/update all catalog items
  for (const item of catalogItems) {
    await prisma.itemMaster.upsert({
      where: { name: item.name },
      update: {
        category: item.category,
        unitId: item.unitId,
        defaultPrice: (item as any).defaultPrice || null,
        requiresPhotos: (item as any).requiresPhotos || false,
        requiresChecklist: (item as any).requiresChecklist ?? true,
        tags: (item as any).tags || [],
        description: item.description,
        sortOrder: item.sortOrder,
        allowedParentTypes: item.allowedParentTypes,
        allowedChildTypes: item.allowedChildTypes,
        canBeRootLevel: item.canBeRootLevel,
        isActive: true,
      },
      create: {
        name: item.name,
        category: item.category,
        // itemType defaults to OTHER, which is fine for measurement catalog
        unitId: item.unitId,
        defaultPrice: (item as any).defaultPrice || null,
        requiresPhotos: (item as any).requiresPhotos || false,
        requiresChecklist: (item as any).requiresChecklist ?? true,
        tags: (item as any).tags || [],
        description: item.description,
        sortOrder: item.sortOrder,
        allowedParentTypes: item.allowedParentTypes,
        allowedChildTypes: item.allowedChildTypes,
        canBeRootLevel: item.canBeRootLevel,
        isActive: true,
      },
    })
  }

  console.log(`✅ Created/updated ${catalogItems.length} catalog items with nesting rules`)

  // Print nesting rule examples
  console.log('\n📋 Nesting Rules Summary:')
  console.log('✓ Property types (Villa, House, etc.) can be at root level')
  console.log('✓ Property types can contain spaces/rooms and items')
  console.log('✓ Spaces/rooms can only be under properties')
  console.log('✓ Spaces/rooms can contain items')
  console.log('✓ Items can be under properties or spaces')
  console.log('✓ OTHER/CUSTOM types bypass all restrictions')
  console.log('\nValid examples:')
  console.log('  • Villa → Room → Sofa ✓')
  console.log('  • Villa → Sofa ✓')
  console.log('  • House → Bedroom → Bed ✓')
  console.log('  • Custom → Anything ✓')
  console.log('\nInvalid examples (will be blocked):')
  console.log('  • Villa → Apartment ✗')
  console.log('  • Apartment → Villa ✗')
  console.log('  • Sofa → Room ✗')
  console.log('  • Item without property/space parent ✗')

  console.log('\n✅ Phase 2: Measurement catalog seeding completed!')
}

seedMeasurementCatalog()
  .catch((e) => {
    console.error('❌ Error seeding measurement catalog:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
