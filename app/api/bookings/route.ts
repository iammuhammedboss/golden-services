import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      phone,
      whatsapp,
      email,
      serviceInterest,
      address,
      city,
      preferredDate,
      preferredTime,
      notes,
      needsSiteVisit,
    } = body

    // Validation
    if (!name || !phone || !serviceInterest || !address) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (needsSiteVisit === 'true' && (!preferredDate || !preferredTime)) {
      return NextResponse.json(
        { error: 'Preferred date and time are required for site visit' },
        { status: 400 }
      )
    }

    // Get session or use system user
    const session = await getServerSession(authOptions)

    let createdById = session?.user?.id

    if (!createdById) {
      let systemUser = await prisma.user.findFirst({
        where: { email: 'system@goldenservices.om' },
      })

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            name: 'System',
            email: 'system@goldenservices.om',
            hashedPassword: '',
            isActive: true,
          },
        })
      }

      createdById = systemUser.id
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        whatsapp: whatsapp || null,
        email: email || null,
        source: 'WEBSITE',
        serviceInterest,
        notes: `Address: ${address}${city ? `, ${city}` : ''}\n\n${notes || ''}`,
        status: 'NEW',
        createdById,
      },
    })

    // Create site visit if requested
    if (needsSiteVisit === 'true' && preferredDate && preferredTime) {
      const scheduledAt = new Date(`${preferredDate}T${preferredTime}`)

      // Find a default user to assign the site visit
      // In production, this should be assigned based on availability
      const defaultAssignee = await prisma.user.findFirst({
        where: { isActive: true },
      })

      if (defaultAssignee) {
        await prisma.siteVisit.create({
          data: {
            leadId: lead.id,
            scheduledAt,
            status: 'SCHEDULED',
            assignedToId: defaultAssignee.id,
            notes: `Site visit requested for: ${address}${city ? `, ${city}` : ''}`,
          },
        })
      }
    }

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
