import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMasters() {
  console.log('🌱 Seeding master data...')

  // Item Type Masters
  const itemTypes = [
    { name: 'WINDOW', category: 'FIXTURES', description: 'Windows and glass panels', sortOrder: 1 },
    { name: 'SOFA', category: 'FURNITURE', description: 'Sofas and couches', sortOrder: 2 },
    { name: 'CURTAIN', category: 'TEXTILE', description: 'Curtains and drapes', sortOrder: 3 },
    { name: 'CUSHION', category: 'TEXTILE', description: 'Cushions and pillows', sortOrder: 4 },
    { name: 'CARPET', category: 'TEXTILE', description: 'Carpets and rugs', sortOrder: 5 },
    { name: 'TABLE', category: 'FURNITURE', description: 'Tables and desks', sortOrder: 6 },
    { name: 'CHAIR', category: 'FURNITURE', description: 'Chairs and seating', sortOrder: 7 },
    { name: 'MATTRESS', category: 'TEXTILE', description: 'Mattresses and bedding', sortOrder: 8 },
    { name: 'STOVE', category: 'APPLIANCE', description: 'Stoves and cooktops', sortOrder: 9 },
    { name: 'OVEN', category: 'APPLIANCE', description: 'Ovens and ranges', sortOrder: 10 },
    { name: 'REFRIGERATOR', category: 'APPLIANCE', description: 'Refrigerators and freezers', sortOrder: 11 },
    { name: 'SINK', category: 'FIXTURES', description: 'Sinks and basins', sortOrder: 12 },
    { name: 'TOILET', category: 'FIXTURES', description: 'Toilets and commodes', sortOrder: 13 },
    { name: 'SHOWER', category: 'FIXTURES', description: 'Showers and bathtubs', sortOrder: 14 },
    { name: 'MIRROR', category: 'FIXTURES', description: 'Mirrors and glass', sortOrder: 15 },
    { name: 'CABINET', category: 'FURNITURE', description: 'Cabinets and storage', sortOrder: 16 },
    { name: 'WARDROBE', category: 'FURNITURE', description: 'Wardrobes and closets', sortOrder: 17 },
    { name: 'BED', category: 'FURNITURE', description: 'Beds and bed frames', sortOrder: 18 },
    { name: 'FLOOR', category: 'SURFACE', description: 'Floor surfaces', sortOrder: 19 },
    { name: 'WALL', category: 'SURFACE', description: 'Wall surfaces', sortOrder: 20 },
    { name: 'CEILING', category: 'SURFACE', description: 'Ceiling surfaces', sortOrder: 21 },
    { name: 'DOOR', category: 'FIXTURES', description: 'Doors and frames', sortOrder: 22 },
    { name: 'FAN', category: 'APPLIANCE', description: 'Ceiling and standing fans', sortOrder: 23 },
    { name: 'AC_UNIT', category: 'APPLIANCE', description: 'Air conditioning units', sortOrder: 24 },
    { name: 'LIGHT_FIXTURE', category: 'FIXTURES', description: 'Light fixtures and lamps', sortOrder: 25 },
    { name: 'OTHER', category: 'MISC', description: 'Other items', sortOrder: 99 },
  ]

  for (const itemType of itemTypes) {
    await prisma.itemTypeMaster.upsert({
      where: { name: itemType.name },
      update: itemType,
      create: itemType,
    })
  }
  console.log(`✅ Created ${itemTypes.length} item types`)

  // Sofa Type Masters
  const sofaTypes = [
    { name: 'TWO_SEATER', description: '2-seater sofa', sortOrder: 1 },
    { name: 'THREE_SEATER', description: '3-seater sofa', sortOrder: 2 },
    { name: 'FOUR_SEATER', description: '4-seater sofa', sortOrder: 3 },
    { name: 'L_SHAPE', description: 'L-shaped sectional', sortOrder: 4 },
    { name: 'U_SHAPE', description: 'U-shaped sectional', sortOrder: 5 },
    { name: 'CORNER', description: 'Corner sofa', sortOrder: 6 },
    { name: 'RECLINER', description: 'Recliner sofa', sortOrder: 7 },
    { name: 'LOVESEAT', description: 'Loveseat', sortOrder: 8 },
    { name: 'CHAISE', description: 'Chaise lounge', sortOrder: 9 },
    { name: 'OTHER', description: 'Other sofa type', sortOrder: 99 },
  ]

  for (const sofaType of sofaTypes) {
    await prisma.sofaTypeMaster.upsert({
      where: { name: sofaType.name },
      update: sofaType,
      create: sofaType,
    })
  }
  console.log(`✅ Created ${sofaTypes.length} sofa types`)

  // Window Size Masters
  const windowSizes = [
    { name: 'SMALL', dimensions: '2ft x 3ft', description: 'Small window', sortOrder: 1 },
    { name: 'MEDIUM', dimensions: '3ft x 4ft', description: 'Medium window', sortOrder: 2 },
    { name: 'LARGE', dimensions: '4ft x 5ft', description: 'Large window', sortOrder: 3 },
    { name: 'EXTRA_LARGE', dimensions: '5ft x 6ft+', description: 'Extra large window', sortOrder: 4 },
    { name: 'SLIDING', dimensions: 'Varies', description: 'Sliding glass door', sortOrder: 5 },
    { name: 'BAY', dimensions: 'Varies', description: 'Bay window', sortOrder: 6 },
    { name: 'CUSTOM', dimensions: 'Custom', description: 'Custom size', sortOrder: 99 },
  ]

  for (const windowSize of windowSizes) {
    await prisma.windowSizeMaster.upsert({
      where: { name: windowSize.name },
      update: windowSize,
      create: windowSize,
    })
  }
  console.log(`✅ Created ${windowSizes.length} window sizes`)

  // Room Type Masters
  const roomTypes = [
    { name: 'LIVING_ROOM', description: 'Living room / Hall', sortOrder: 1 },
    { name: 'BEDROOM', description: 'Bedroom', sortOrder: 2 },
    { name: 'MASTER_BEDROOM', description: 'Master bedroom', sortOrder: 3 },
    { name: 'GUEST_ROOM', description: 'Guest room', sortOrder: 4 },
    { name: 'KITCHEN', description: 'Kitchen', sortOrder: 5 },
    { name: 'DINING_ROOM', description: 'Dining room', sortOrder: 6 },
    { name: 'BATHROOM', description: 'Bathroom', sortOrder: 7 },
    { name: 'TOILET', description: 'Toilet / Powder room', sortOrder: 8 },
    { name: 'ATTACHED_BATHROOM', description: 'Attached bathroom', sortOrder: 9 },
    { name: 'BALCONY', description: 'Balcony', sortOrder: 10 },
    { name: 'TERRACE', description: 'Terrace', sortOrder: 11 },
    { name: 'OFFICE', description: 'Office / Study', sortOrder: 12 },
    { name: 'LAUNDRY', description: 'Laundry room', sortOrder: 13 },
    { name: 'STORAGE', description: 'Storage / Store room', sortOrder: 14 },
    { name: 'GARAGE', description: 'Garage', sortOrder: 15 },
    { name: 'ENTRANCE', description: 'Entrance / Foyer', sortOrder: 16 },
    { name: 'CORRIDOR', description: 'Corridor / Hallway', sortOrder: 17 },
    { name: 'STAIRCASE', description: 'Staircase', sortOrder: 18 },
    { name: 'PRAYER_ROOM', description: 'Prayer room', sortOrder: 19 },
    { name: 'MAID_ROOM', description: 'Maid room', sortOrder: 20 },
    { name: 'OTHER', description: 'Other room type', sortOrder: 99 },
  ]

  for (const roomType of roomTypes) {
    await prisma.roomTypeMaster.upsert({
      where: { name: roomType.name },
      update: roomType,
      create: roomType,
    })
  }
  console.log(`✅ Created ${roomTypes.length} room types`)

  // Payment Method Masters
  const paymentMethods = [
    { name: 'CASH', description: 'Cash payment', sortOrder: 1 },
    { name: 'CARD', description: 'Credit/Debit card', sortOrder: 2 },
    { name: 'BANK_TRANSFER', description: 'Bank transfer', sortOrder: 3 },
    { name: 'CHEQUE', description: 'Cheque payment', sortOrder: 4 },
    { name: 'ONLINE', description: 'Online payment', sortOrder: 5 },
    { name: 'UPI', description: 'UPI payment', sortOrder: 6 },
    { name: 'WALLET', description: 'Digital wallet', sortOrder: 7 },
    { name: 'OTHER', description: 'Other payment method', sortOrder: 99 },
  ]

  for (const paymentMethod of paymentMethods) {
    await prisma.paymentMethodMaster.upsert({
      where: { name: paymentMethod.name },
      update: paymentMethod,
      create: paymentMethod,
    })
  }
  console.log(`✅ Created ${paymentMethods.length} payment methods`)

  console.log('✅ Master data seeding completed!')
}

seedMasters()
  .catch((e) => {
    console.error('❌ Error seeding master data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
