import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMasters() {
  console.log('🌱 Seeding master data...')

  // Unit Masters
  const units = [
    { name: 'PIECE', description: 'Individual piece or unit' },
    { name: 'SET', description: 'Set of items' },
    { name: 'SQM', description: 'Square meter' },
    { name: 'SQF', description: 'Square foot' },
    { name: 'PAIR', description: 'Pair of items' },
  ]

  for (const unit of units) {
    await prisma.unitMaster.upsert({
      where: { name: unit.name },
      update: unit,
      create: unit,
    })
  }
  console.log(`✅ Created ${units.length} units`)

  // Get the default unit (PIECE) for item masters
  const defaultUnit = await prisma.unitMaster.findFirst({
    where: { name: 'PIECE' }
  })

  if (!defaultUnit) {
    throw new Error('Default unit (PIECE) not found')
  }

  // Item Type Masters
  const itemTypes = [
    { name: 'WINDOW', category: 'FIXTURES', description: 'Windows and glass panels', sortOrder: 1, unitId: defaultUnit.id },
    { name: 'SOFA', category: 'FURNITURE', description: 'Sofas and couches', sortOrder: 2, unitId: defaultUnit.id },
    { name: 'CURTAIN', category: 'TEXTILE', description: 'Curtains and drapes', sortOrder: 3, unitId: defaultUnit.id },
    { name: 'CUSHION', category: 'TEXTILE', description: 'Cushions and pillows', sortOrder: 4, unitId: defaultUnit.id },
    { name: 'CARPET', category: 'TEXTILE', description: 'Carpets and rugs', sortOrder: 5, unitId: defaultUnit.id },
    { name: 'TABLE', category: 'FURNITURE', description: 'Tables and desks', sortOrder: 6, unitId: defaultUnit.id },
    { name: 'CHAIR', category: 'FURNITURE', description: 'Chairs and seating', sortOrder: 7, unitId: defaultUnit.id },
    { name: 'MATTRESS', category: 'TEXTILE', description: 'Mattresses and bedding', sortOrder: 8, unitId: defaultUnit.id },
    { name: 'STOVE', category: 'APPLIANCE', description: 'Stoves and cooktops', sortOrder: 9, unitId: defaultUnit.id },
    { name: 'OVEN', category: 'APPLIANCE', description: 'Ovens and ranges', sortOrder: 10, unitId: defaultUnit.id },
    { name: 'REFRIGERATOR', category: 'APPLIANCE', description: 'Refrigerators and freezers', sortOrder: 11, unitId: defaultUnit.id },
    { name: 'SINK', category: 'FIXTURES', description: 'Sinks and basins', sortOrder: 12, unitId: defaultUnit.id },
    { name: 'TOILET', category: 'FIXTURES', description: 'Toilets and commodes', sortOrder: 13, unitId: defaultUnit.id },
    { name: 'SHOWER', category: 'FIXTURES', description: 'Showers and bathtubs', sortOrder: 14, unitId: defaultUnit.id },
    { name: 'MIRROR', category: 'FIXTURES', description: 'Mirrors and glass', sortOrder: 15, unitId: defaultUnit.id },
    { name: 'CABINET', category: 'FURNITURE', description: 'Cabinets and storage', sortOrder: 16, unitId: defaultUnit.id },
    { name: 'WARDROBE', category: 'FURNITURE', description: 'Wardrobes and closets', sortOrder: 17, unitId: defaultUnit.id },
    { name: 'BED', category: 'FURNITURE', description: 'Beds and bed frames', sortOrder: 18, unitId: defaultUnit.id },
    { name: 'FLOOR', category: 'SURFACE', description: 'Floor surfaces', sortOrder: 19, unitId: defaultUnit.id },
    { name: 'WALL', category: 'SURFACE', description: 'Wall surfaces', sortOrder: 20, unitId: defaultUnit.id },
    { name: 'CEILING', category: 'SURFACE', description: 'Ceiling surfaces', sortOrder: 21, unitId: defaultUnit.id },
    { name: 'DOOR', category: 'FIXTURES', description: 'Doors and frames', sortOrder: 22, unitId: defaultUnit.id },
    { name: 'FAN', category: 'APPLIANCE', description: 'Ceiling and standing fans', sortOrder: 23, unitId: defaultUnit.id },
    { name: 'AC_UNIT', category: 'APPLIANCE', description: 'Air conditioning units', sortOrder: 24, unitId: defaultUnit.id },
    { name: 'LIGHT_FIXTURE', category: 'FIXTURES', description: 'Light fixtures and lamps', sortOrder: 25, unitId: defaultUnit.id },
    { name: 'OTHER', category: 'MISC', description: 'Other items', sortOrder: 99, unitId: defaultUnit.id },
  ]

  for (const itemType of itemTypes) {
    await prisma.itemMaster.upsert({
      where: { name: itemType.name },
      update: itemType,
      create: itemType,
    })
  }
  console.log(`✅ Created ${itemTypes.length} item types`)

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
