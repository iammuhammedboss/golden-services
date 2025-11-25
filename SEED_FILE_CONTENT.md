# Database Seed File Content

Copy the content below and save it as `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
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
    },
  })
  console.log('✓ Owner user created:', ownerUser.email)

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
      where: { id: categoryData.name },
      update: {},
      create: categoryData,
    })
    createdCategories[categoryData.name] = category
  }
  console.log('✓ Service categories created')

  // 4. Create Services
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
```

## Instructions

1. Delete the existing empty `prisma/seed.ts` file
2. Create a new `prisma/seed.ts` file with the content above
3. Make sure to copy everything including the imports and the main function

## Next Steps

After creating the seed file, run:

```bash
# Generate Prisma client
npm run postinstall

# Push schema to database
npm run db:push

# Run the seed script
npm run db:seed
```
