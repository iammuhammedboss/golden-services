import { prisma } from '@/lib/prisma'

async function seedTemplates() {
  console.log('🌱 Seeding template data...')

  // Terms Templates
  const termsTemplates = [
    {
      name: 'Standard Terms',
      content: '1. Payment terms: 50% advance, 50% upon completion.\n2. Warranty: 30 days on labor.\n3. Cancellation: 24 hours notice required.\n4. Materials: Client to provide or approve materials.',
      sortOrder: 1
    },
    {
      name: 'Corporate Terms',
      content: '1. Payment terms: Net 30 days.\n2. Warranty: 90 days on labor and materials.\n3. PO required for all work.\n4. Monthly billing available for approved accounts.',
      sortOrder: 2
    },
    {
      name: 'Quick Service Terms',
      content: '1. Payment: Full payment upon completion.\n2. Warranty: 15 days on labor.\n3. Same-day service available.\n4. No cancellation fee if cancelled before technician dispatch.',
      sortOrder: 3
    }
  ]

  for (const template of termsTemplates) {
    await prisma.termsTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template
    })
  }

  // Bank Details Templates
  const bankTemplates = [
    {
      name: 'Primary Bank',
      content: 'Bank Name: National Bank of Oman\nAccount Name: Golden Services LLC\nAccount Number: 1234567890\nIBAN: OM12 3456 7890 1234 5678 90\nSwift Code: NBOMOMRX',
      sortOrder: 1
    },
    {
      name: 'Corporate Account',
      content: 'Bank Name: Bank Muscat\nAccount Name: Golden Services Corporate\nAccount Number: 9876543210\nIBAN: OM98 7654 3210 9876 5432 10\nSwift Code: BMUSOMRX',
      sortOrder: 2
    }
  ]

  for (const template of bankTemplates) {
    await prisma.bankDetailsTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template
    })
  }

  // Update Item Masters with specific item types
  const itemUpdates = [
    { name: 'Sofa', itemType: 'SOFA' },
    { name: 'Carpet', itemType: 'CARPET' },
    { name: 'Curtains', itemType: 'CURTAINS' },
    { name: 'Water Tank', itemType: 'TANK' },
    { name: 'Television', itemType: 'TV' },
    { name: 'Dining Table', itemType: 'TABLE' },
    { name: 'Chair', itemType: 'CHAIR' },
    { name: 'Door Mat', itemType: 'MAT' },
    { name: 'Main Door', itemType: 'DOOR' },
    { name: 'Door Handle', itemType: 'HANDLE' },
    { name: 'Window', itemType: 'WINDOW' },
    { name: 'Interlock Tiles', itemType: 'INTERLOCK' }
  ]

  for (const update of itemUpdates) {
    await prisma.itemMaster.updateMany({
      where: { 
        name: { contains: update.name.split(' ')[0], mode: 'insensitive' }
      },
      data: { itemType: update.itemType }
    })
  }

  console.log('✅ Template seeding completed')
}

if (require.main === module) {
  seedTemplates()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedTemplates }
