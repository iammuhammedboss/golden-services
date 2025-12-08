import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as z from 'zod'

const streamlinedFormSchema = z.object({
  clientId: z.string().optional(),
  newClient: z
    .object({
      name: z.string(),
      phone: z.string(),
    })
    .optional(),
  siteId: z.string().optional(),
  newSite: z
    .object({
      name: z.string(),
      address: z.string(),
    })
    .optional(),
  scheduledAt: z.string().datetime(),
  assignedToId: z.string(),
  notes: z.string().optional(),
  measurements: z.array(
    z.object({
      itemTypeId: z.string(),
      roomTypeId: z.string().optional(),
      quantity: z.number(),
      size: z.string().optional(),
      customDescription: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = streamlinedFormSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const result = await prisma.$transaction(async (tx) => {
      let finalClientId = data.clientId
      if (data.newClient) {
        const newClient = await tx.client.create({
          data: {
            name: data.newClient.name,
            phone: data.newClient.phone,
          },
        })
        finalClientId = newClient.id
      }

      if (!finalClientId) {
        throw new Error('Client ID is required')
      }

      let finalSiteId = data.siteId
      if (data.newSite) {
        const newSite = await tx.site.create({
          data: {
            clientId: finalClientId,
            name: data.newSite.name,
            address: data.newSite.address,
          },
        })
        finalSiteId = newSite.id
      }

      if (!finalSiteId) {
        throw new Error('Site ID is required')
      }

      const siteVisit = await tx.siteVisit.create({
        data: {
          clientId: finalClientId,
          siteId: finalSiteId,
          scheduledAt: data.scheduledAt,
          assignedToId: data.assignedToId,
          notes: data.notes,
          status: 'SCHEDULED',
        },
      })

      const measurementsToCreate = data.measurements.map((m) => ({
        ...m,
        siteVisitId: siteVisit.id,
      }))

      await tx.measurementItem.createMany({
        data: measurementsToCreate,
      })

      return siteVisit
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating streamlined measurement:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create measurement'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
