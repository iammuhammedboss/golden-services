import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SALES_EXECUTIVES = [
  {
    code: 'JS',
    name: 'Jesfin',
    email: 'jesfin@goldenservices.ae',
    phone: null,
    isActive: true,
  },
  {
    code: 'HS',
    name: 'Hossam',
    email: 'hossam@goldenservices.ae',
    phone: null,
    isActive: true,
  },
  {
    code: 'AS',
    name: 'Ashlin',
    email: 'ashlin@goldenservices.ae',
    phone: null,
    isActive: true,
  },
]

async function main() {
  console.log('Seeding sales executives...')

  for (const executive of SALES_EXECUTIVES) {
    const existing = await prisma.salesExecutive.findUnique({
      where: { code: executive.code },
    })

    if (existing) {
      console.log(`Sales executive ${executive.code} already exists, updating...`)
      await prisma.salesExecutive.update({
        where: { code: executive.code },
        data: executive,
      })
    } else {
      console.log(`Creating sales executive ${executive.code}...`)
      await prisma.salesExecutive.create({
        data: executive,
      })
    }
  }

  console.log('Sales executives seeded successfully!')

  // Display all sales executives
  const allExecutives = await prisma.salesExecutive.findMany({
    where: { deletedAt: null },
  })

  console.log('\nCurrent sales executives:')
  console.table(
    allExecutives.map((exec) => ({
      Code: exec.code,
      Name: exec.name,
      Email: exec.email,
      Active: exec.isActive ? 'Yes' : 'No',
    }))
  )
}

main()
  .catch((e) => {
    console.error('Error seeding sales executives:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
