import { PrismaClient, ClientType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // 1. Create Roles
  console.log('Creating roles...')
  const roles = [
    { name: 'OWNER', description: 'Business owner with full access' },
    { name: 'OPERATIONS_MANAGER', description: 'Manages operations and job orders' },
    { name: 'SALES', description: 'Handles leads, quotations, and client relations' },
    { name: 'SUPERVISOR', description: 'Supervises field staff and jobs' },
    { name: 'CLEANER', description: 'Performs cleaning services' },
    { name: 'ACCOUNTANT', description: 'Manages finances and invoices' },
    { name: 'RECEPTION', description: 'Handles reception and customer support' },
    { name: 'AUDITOR', description: 'Audits quality and compliance' },
  ]

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    })
  }
  console.log('✓ Roles created')

  // 2. Create Owner User
  console.log('Creating owner user...')
  const hashedPassword = await bcrypt.hash('Admin123!', 10)
  const ownerRole = await prisma.role.findUnique({ where: { name: 'OWNER' } })

  if (!ownerRole) {
    throw new Error('Owner role not found')
  }

  const ownerUser = await prisma.user.upsert({
    where: { email: 'admin@goldenservices.test' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@goldenservices.test',
      phone: '+96812345678',
      whatsapp: '+96812345678',
      hashedPassword,
      isActive: true,
      roles: {
        create: {
          roleId: ownerRole.id,
        },
      },
      // Initialize notification settings for the owner
      notificationSettings: {
        create: {
          reminders: {
            job_scheduled: { email: true, sms: false },
            job_reminder_30min: { push: true },
          },
        },
      },
    },
  })
  console.log('✓ Owner user created:', ownerUser.email)

  // Create sample clients for testing
  console.log('Creating sample clients...')
  const sampleClients: Array<{
    name: string;
    phone: string;
    whatsapp: string;
    email: string;
    type: ClientType;
    source: 'PHONE' | 'WHATSAPP' | 'SOCIAL_MEDIA' | 'WEBSITE_FORM' | 'REFERRAL' | 'OTHER';
    status: 'NEW' | 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED';
    notes: string;
  }> = [
    {
      name: 'Ahmed Al-Maskari',
      phone: '+96898765432',
      whatsapp: '+96898765432',
      email: 'ahmed@example.com',
      type: 'INDIVIDUAL',
      source: 'PHONE',
      status: 'ACTIVE',
      notes: 'Regular customer for cleaning services',
    },
    {
      name: 'Oman Trading Company',
      phone: '+96891234567',
      whatsapp: '+96891234567',
      email: 'contact@omantrading.com',
      type: 'CORPORATE',
      source: 'WEBSITE_FORM',
      status: 'NEW',
      notes: 'Corporate client for office cleaning',
    },
    {
      name: 'Fatma Al-Siyabi',
      phone: '+96892345678',
      whatsapp: '+96892345678',
      email: 'fatma@example.com',
      type: 'INDIVIDUAL',
      source: 'WHATSAPP',
      status: 'ACTIVE',
      notes: 'Interested in pest control services',
    },
    {
      name: 'Muscat Grand Hotel',
      phone: '+96893456789',
      whatsapp: '+96893456789',
      email: 'info@muscatgrandhotel.com',
      type: 'CORPORATE',
      source: 'REFERRAL',
      status: 'INACTIVE',
      notes: 'Hotel requiring regular deep cleaning',
    },
  ];

  for (const clientData of sampleClients) {
    // Check if client with this phone already exists
    const existing = await prisma.client.findFirst({
      where: { phone: clientData.phone }
    });
    if (!existing) {
      await prisma.client.create({
        data: clientData,
      });
    }
  }
  console.log('✓ Sample clients created');

  // 3. Create Service Categories
  console.log('Creating service categories...')
  const categories = [
    {
      name: 'Cleaning Services',
      description: 'Professional cleaning services for homes and offices',
    },
    {
      name: 'Pest Control',
      description: 'Pest control and fumigation services',
    },
    {
      name: 'Water Tank Services',
      description: 'Water tank cleaning and maintenance',
    },
    {
      name: 'Manpower Services',
      description: 'Skilled and unskilled manpower supply',
    },
  ]

  const createdCategories: { [key: string]: any } = {}
  for (const categoryData of categories) {
    const category = await prisma.serviceCategory.upsert({
      where: { name: categoryData.name }, // Use name for upsert where to avoid conflicts
      update: {},
      create: categoryData,
    })
    createdCategories[categoryData.name] = category
  }
  console.log('✓ Service categories created')

  // 4. Create Units Master
  console.log('Creating units master...')
  const unitsData = [
    { name: 'Piece', description: 'Individual item' },
    { name: 'Sq Meter', description: 'Square meter' },
    { name: 'Running Meter', description: 'Linear meter' },
    { name: 'Hour', description: 'Per hour' },
    { name: 'Visit', description: 'Per visit' },
    { name: 'Lump Sum', description: 'Fixed price' },
    { name: 'Set', description: 'A collection of items' },
    { name: 'Kilogram', description: 'Weight in kilograms' },
  ]
  const createdUnits: { [key: string]: any } = {}
  for (const unitData of unitsData) {
    const unit = await prisma.unitMaster.upsert({
      where: { name: unitData.name },
      update: {},
      create: unitData,
    })
    createdUnits[unitData.name] = unit
  }
  console.log('✓ Units master created')

  // 5. Create Item Master
  console.log('Creating item master...')
  const itemMasterData = [
    // Furniture
    {
      name: 'Sofa',
      category: 'Furniture',
      unitName: 'Piece',
      defaultPrice: '3.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['fabric', 'leather'],
    },
    {
      name: 'Office Chair',
      category: 'Furniture',
      unitName: 'Piece',
      defaultPrice: '2.000',
      requiresPhotos: false,
      requiresChecklist: true,
      tags: ['office'],
    },
    {
      name: 'Dining Table',
      category: 'Furniture',
      unitName: 'Piece',
      defaultPrice: '5.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['wood', 'glass'],
    },
    {
      name: 'Dining Chair',
      category: 'Furniture',
      unitName: 'Piece',
      defaultPrice: '1.500',
      requiresPhotos: false,
      requiresChecklist: true,
      tags: ['wood', 'fabric'],
    },
    // Flooring
    {
      name: 'Carpet',
      category: 'Flooring',
      unitName: 'Sq Meter',
      defaultPrice: '1.500',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['rug', 'textile'],
    },
    {
      name: 'Floor Mat',
      category: 'Flooring',
      unitName: 'Piece',
      defaultPrice: '2.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['mat'],
    },
    {
      name: 'Interlock Area',
      category: 'Flooring',
      unitName: 'Sq Meter',
      defaultPrice: '0.500',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['outdoor', 'pavement'],
    },
    // Fixtures
    {
      name: 'Window',
      category: 'Fixture',
      unitName: 'Piece',
      defaultPrice: '2.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['glass'],
    },
    {
      name: 'Door',
      category: 'Fixture',
      unitName: 'Piece',
      defaultPrice: '3.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['wood', 'metal'],
    },
    {
      name: 'Door Handle',
      category: 'Fixture',
      unitName: 'Piece',
      defaultPrice: '0.500',
      requiresPhotos: false,
      requiresChecklist: true,
      tags: ['metal', 'brass'],
    },
    // Bedding
    {
      name: 'Mattress',
      category: 'Bedding',
      unitName: 'Piece',
      defaultPrice: '5.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['bed'],
    },
    {
      name: 'Pillow',
      category: 'Bedding',
      unitName: 'Piece',
      defaultPrice: '1.000',
      requiresPhotos: false,
      requiresChecklist: true,
      tags: ['bed'],
    },
    // Textiles
    {
      name: 'Curtain Panel',
      category: 'Textile',
      unitName: 'Piece',
      defaultPrice: '4.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['fabric', 'window'],
    },
    {
      name: 'Curtain',
      category: 'Textile',
      unitName: 'Running Meter',
      defaultPrice: '3.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['fabric', 'window'],
    },
    // Appliances & Electronics
    {
      name: 'TV',
      category: 'Appliance',
      unitName: 'Piece',
      defaultPrice: '8.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['electronics', 'screen'],
    },
    {
      name: 'AC Unit',
      category: 'Appliance',
      unitName: 'Piece',
      defaultPrice: '12.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['hvac'],
    },
    {
      name: 'Water Tank',
      category: 'Appliance',
      unitName: 'Piece',
      defaultPrice: '20.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['water', 'storage'],
    },
    // Room Components
    {
      name: 'Staircase',
      category: 'Room Component',
      unitName: 'Piece',
      defaultPrice: '25.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['stairs'],
    },
    {
      name: 'Balcony',
      category: 'Room Component',
      unitName: 'Piece',
      defaultPrice: '15.000',
      requiresPhotos: true,
      requiresChecklist: true,
      tags: ['outdoor'],
    },
    {
      name: 'Passage/Corridor',
      category: 'Room Component',
      unitName: 'Sq Meter',
      defaultPrice: '0.800',
      requiresPhotos: false,
      requiresChecklist: true,
      tags: ['hallway'],
    },
  ]
  for (const itemData of itemMasterData) {
    const unit = createdUnits[itemData.unitName]
    if (!unit) {
      console.error(`Unit not found for item ${itemData.name}: ${itemData.unitName}`)
      continue
    }
    await prisma.itemMaster.upsert({
      where: { name: itemData.name },
      update: {},
      create: {
        name: itemData.name,
        category: itemData.category,
        unitId: unit.id,
        defaultPrice: itemData.defaultPrice,
        requiresPhotos: itemData.requiresPhotos,
        requiresChecklist: itemData.requiresChecklist,
        tags: itemData.tags,
        isActive: true,
      },
    })
  }
  console.log('✓ Item master created')

  // 6. Create Equipment Master
  console.log('Creating equipment master...')
  const equipmentData = [
    { name: 'Vacuum Cleaner', description: 'Industrial vacuum cleaner' },
    { name: 'Injection Extraction Machine', description: 'For deep cleaning carpets/upholstery' },
    { name: 'Scrubbing Machine', description: 'Floor scrubbing machine' },
    { name: 'Polisher', description: 'Floor polishing machine' },
    { name: 'Steam Cleaner', description: 'High-pressure steam cleaner' },
  ]
  for (const eqData of equipmentData) {
    await prisma.equipmentMaster.upsert({
      where: { name: eqData.name },
      update: {},
      create: eqData,
    })
  }
  console.log('✓ Equipment master created')

  // 7. Create Material Master
  console.log('Creating material master...')
  const materialData = [
    { name: 'All-purpose Cleaner', description: 'General cleaning solution' },
    { name: 'Window Cleaner', description: 'Glass cleaning solution' },
    { name: 'Carpet Shampoo', description: 'Specialized carpet cleaning shampoo' },
    { name: 'Disinfectant', description: 'Hospital-grade disinfectant' },
    { name: 'Pest Control Spray', description: 'Insecticide for general pests' },
  ]
  for (const matData of materialData) {
    await prisma.materialMaster.upsert({
      where: { name: matData.name },
      update: {},
      create: matData,
    })
  }
  console.log('✓ Material master created')

  // 8. Create Room Type Master
  console.log('Creating room type master...')
  const roomTypeData = [
    { name: 'Hall', description: 'Living area' },
    { name: 'Bedroom', description: 'Sleeping area' },
    { name: 'Kitchen', description: 'Food preparation area' },
    { name: 'Bathroom', description: 'Restroom' },
    { name: 'Office Cubicle', description: 'Individual office workspace' },
    { name: 'Conference Room', description: 'Meeting room' },
    { name: 'Warehouse Zone', description: 'Storage area' },
    { name: 'Dental Treatment Room', description: 'Medical treatment room' },
  ]
  for (const rtData of roomTypeData) {
    await prisma.roomTypeMaster.upsert({
      where: { name: rtData.name },
      update: {},
      create: rtData,
    })
  }
  console.log('✓ Room type master created')

  // 9. Create Payment Method Master
  console.log('Creating payment method master...')
  const paymentMethodData = [
    { name: 'CASH', description: 'Cash payment' },
    { name: 'CARD', description: 'Credit/Debit Card' },
    { name: 'BANK_TRANSFER', description: 'Bank Transfer' },
    { name: 'CHEQUE', description: 'Cheque payment' },
  ]
  for (const pmData of paymentMethodData) {
    await prisma.paymentMethodMaster.upsert({
      where: { name: pmData.name },
      update: {},
      create: pmData,
    })
  }
  console.log('✓ Payment method master created')

  // 10. Create Terms and Bank Details Templates
  console.log('Creating terms and bank details templates...');
  const termsTemplates = [
    {
      name: 'Default Cleaning Terms',
      content: '1. All prices are exclusive of VAT.\n2. Payment to be made upon completion of work.\n3. We are not responsible for any damage to old or worn-out items.',
    },
    {
      name: 'Pest Control Terms',
      content: '1. Client must vacate the premises during treatment.\n2. A follow-up visit may be required.\n3. Warranty is applicable for 3 months.',
    },
  ];
  for (const template of termsTemplates) {
    await prisma.termsTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  const bankDetailsTemplates = [
    {
      name: 'Default Bank Account',
      content: 'Bank Name: National Bank of Oman\nAccount Name: Golden Services Company LLC\nAccount Number: 1234-567890-001\nIBAN: OM1234567890001',
    },
  ];
  for (const template of bankDetailsTemplates) {
    await prisma.bankDetailsTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }
  console.log('✓ Terms and bank details templates created');

  // 11. Create Services (Existing logic for services remains)
  console.log('Creating services...')
  const services = [
    // Cleaning Services
    {
      categoryName: 'Cleaning Services',
      name: 'Sofa Cleaning',
      slug: 'sofa-cleaning',
      description: 'Professional deep cleaning of sofas and upholstery',
      pricingRules: [
        { pricingType: 'PER_UNIT', unitLabel: 'Per Seat', basePrice: '3.000' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Carpet Cleaning',
      slug: 'carpet-cleaning',
      description: 'Deep cleaning and stain removal for carpets',
      pricingRules: [
        { pricingType: 'PER_SQM', unitLabel: 'Per Square Meter', basePrice: '1.500' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Mattress Cleaning',
      slug: 'mattress-cleaning',
      description: 'Sanitization and deep cleaning of mattresses',
      pricingRules: [
        { pricingType: 'PER_UNIT', unitLabel: 'Per Mattress', basePrice: '5.000' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Deep Cleaning',
      slug: 'deep-cleaning',
      description: 'Comprehensive deep cleaning for entire premises',
      pricingRules: [
        { pricingType: 'PER_VISIT', unitLabel: 'Per Visit', basePrice: '50.000' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Office Cleaning',
      slug: 'office-cleaning',
      description: 'Regular office cleaning and maintenance',
      pricingRules: [
        { pricingType: 'PER_SQM', unitLabel: 'Per Square Meter', basePrice: '0.500' },
        { pricingType: 'PER_VISIT', unitLabel: 'Per Visit', basePrice: '30.000' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Kitchen Deep Cleaning',
      slug: 'kitchen-deep-cleaning',
      description: 'Intensive cleaning of kitchen including appliances and exhausts',
      pricingRules: [
        { pricingType: 'LUMP_SUM', unitLabel: 'Per Kitchen', basePrice: '40.000' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Bathroom Cleaning',
      slug: 'bathroom-cleaning',
      description: 'Thorough bathroom cleaning and sanitization',
      pricingRules: [
        { pricingType: 'PER_UNIT', unitLabel: 'Per Bathroom', basePrice: '8.000' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Window Cleaning',
      slug: 'window-cleaning',
      description: 'Interior and exterior window cleaning',
      pricingRules: [
        { pricingType: 'PER_SQM', unitLabel: 'Per Square Meter', basePrice: '2.000' },
      ],
    },
    {
      categoryName: 'Cleaning Services',
      name: 'Curtain Cleaning',
      slug: 'curtain-cleaning',
      description: 'Professional curtain cleaning and pressing',
      pricingRules: [
        { pricingType: 'PER_UNIT', unitLabel: 'Per Curtain Panel', basePrice: '4.000' },
      ],
    },
    // Pest Control
    {
      categoryName: 'Pest Control',
      name: 'General Pest Control',
      slug: 'general-pest-control',
      description: 'Treatment for common household pests',
      pricingRules: [
        { pricingType: 'PER_VISIT', unitLabel: 'Per Visit', basePrice: '25.000' },
      ],
    },
    {
      categoryName: 'Pest Control',
      name: 'Termite Treatment',
      slug: 'termite-treatment',
      description: 'Specialized termite detection and treatment',
      pricingRules: [
        { pricingType: 'LUMP_SUM', unitLabel: 'Per Treatment', basePrice: '100.000' },
      ],
    },
    {
      categoryName: 'Pest Control',
      name: 'Rodent Control',
      slug: 'rodent-control',
      description: 'Rodent elimination and prevention',
      pricingRules: [
        { pricingType: 'PER_VISIT', unitLabel: 'Per Visit', basePrice: '30.000' },
      ],
    },
    {
      categoryName: 'Pest Control',
      name: 'Fumigation',
      slug: 'fumigation',
      description: 'Complete fumigation service for premises',
      pricingRules: [
        { pricingType: 'PER_SQM', unitLabel: 'Per Square Meter', basePrice: '0.300' },
      ],
    },
    // Water Tank Services
    {
      categoryName: 'Water Tank Services',
      name: 'Water Tank Cleaning',
      slug: 'water-tank-cleaning',
      description: 'Complete cleaning and sanitization of water tanks',
      pricingRules: [
        { pricingType: 'PER_UNIT', unitLabel: 'Per Tank', basePrice: '20.000' },
      ],
    },
    {
      categoryName: 'Water Tank Services',
      name: 'Water Tank Disinfection',
      slug: 'water-tank-disinfection',
      description: 'Chemical disinfection and treatment',
      pricingRules: [
        { pricingType: 'PER_UNIT', unitLabel: 'Per Tank', basePrice: '15.000' },
      ],
    },
    // Manpower Services
    {
      categoryName: 'Manpower Services',
      name: 'Cleaner Supply',
      slug: 'cleaner-supply',
      description: 'Trained cleaning staff supply',
      pricingRules: [
        { pricingType: 'PER_HOUR', unitLabel: 'Per Hour', basePrice: '2.500' },
      ],
    },
    {
      categoryName: 'Manpower Services',
      name: 'Supervisor Supply',
      slug: 'supervisor-supply',
      description: 'Experienced supervisor supply',
      pricingRules: [
        { pricingType: 'PER_HOUR', unitLabel: 'Per Hour', basePrice: '4.000' },
      ],
    },
    {
      categoryName: 'Manpower Services',
      name: 'Helper Supply',
      slug: 'helper-supply',
      description: 'General helper supply for various tasks',
      pricingRules: [
        { pricingType: 'PER_HOUR', unitLabel: 'Per Hour', basePrice: '2.000' },
      ],
    },
  ]

  for (const serviceData of services) {
    const category = createdCategories[serviceData.categoryName]
    if (!category) {
      console.error(`Category not found: ${serviceData.categoryName}`)
      continue
    }

    const service = await prisma.service.upsert({
      where: { slug: serviceData.slug },
      update: {},
      create: {
        categoryId: category.id,
        name: serviceData.name,
        slug: serviceData.slug,
        description: serviceData.description,
        isActive: true,
      },
    })

    // Create pricing rules
    for (const rule of serviceData.pricingRules) {
      await prisma.servicePricingRule.create({
        data: {
          serviceId: service.id,
          pricingType: rule.pricingType as any,
          unitLabel: rule.unitLabel,
          basePrice: rule.basePrice,
          currency: 'OMR',
        },
      })
    }
  }
  console.log('✓ Services and pricing rules created')

  console.log('\n=== Seed completed successfully! ===')
  console.log('\nLogin credentials:')
  console.log('Email: admin@goldenservices.test')
  console.log('Password: Admin123!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

