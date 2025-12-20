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
        { error: 'Missing required fields: name, phone, service interest, and address are required' },
        { status: 400 }
      )
    }

    // Basic phone validation
    const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 8) {
      return NextResponse.json(
        { error: 'Phone number must be at least 8 digits' },
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

    // Check if client with same phone already exists
    let existingClient = await prisma.client.findFirst({
      where: {
        phone: phone,
        deletedAt: null,
      },
    })

    let client
    if (existingClient) {
      client = existingClient
      // Update client information if needed
      await prisma.client.update({
        where: { id: client.id },
        data: {
          name: name,
          email: email || client.email,
          whatsapp: whatsapp || client.whatsapp,
          notes: client.notes ? `${client.notes}\n\nNew booking: ${new Date().toISOString()}\nService: ${serviceInterest}\nAddress: ${address}${city ? `, ${city}` : ''}\n${notes || ''}` 
                 : `New booking: ${new Date().toISOString()}\nService: ${serviceInterest}\nAddress: ${address}${city ? `, ${city}` : ''}\n${notes || ''}`,
        },
      })
    } else {
      // Create new client
      client = await prisma.client.create({
        data: {
          name,
          phone,
          whatsapp: whatsapp || null,
          email: email || null,
          notes: `Address: ${address}${city ? `, ${city}` : ''}\nService interest: ${serviceInterest}\n${notes || ''}`,
        },
      })
    }

    // Create site visit if requested
    if (needsSiteVisit === 'true' && preferredDate && preferredTime) {
      const scheduledAt = new Date(`${preferredDate}T${preferredTime}`)

      // Find a default user to assign the site visit
      const defaultAssignee = await prisma.user.findFirst({
        where: { isActive: true },
      })

      if (defaultAssignee) {
        await prisma.siteVisit.create({
          data: {
            clientId: client.id,
            scheduledAt,
            status: 'PENDING',
            assignedToId: defaultAssignee.id,
            locationText: address ? `${address}${city ? `, ${city}` : ''}` : null,
            notes: `Site visit requested for: ${address}${city ? `, ${city}` : ''}\nService interest: ${serviceInterest}`,
          },
        })
      }
    }

    // TODO: Create notification for relevant roles when notification system is implemented
    // try {
    //   await prisma.notificationQueue.createMany({
    //     data: [
    //       {
    //         userId: 'SALES_USER_ID',
    //         type: 'NEW_CLIENT',
    //         channel: 'PUSH',
    //         sendAt: new Date(),
    //         payload: {
    //           title: 'New Client from Website',
    //           message: `New client ${name} (${phone}) registered from website`,
    //           entityType: 'Client',
    //           entityId: client.id,
    //         },
    //       },
    //     ],
    //   })
    // } catch (error) {
    //   console.error('Failed to create notifications:', error)
    //   // Don't fail the booking if notifications fail
    // }

    return NextResponse.json({ client }, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
