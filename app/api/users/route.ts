import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { canManageUsers } from '@/lib/permissions'

// GET /api/users - List all active users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to manage users
    const currentUser = session.user as any
    if (!canManageUsers(currentUser)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, phone, whatsapp, password, roleIds } = body

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one role must be assigned' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        whatsapp: whatsapp || null,
        hashedPassword,
        isActive: true,
        roles: {
          create: roleIds.map((roleId: string) => ({
            roleId,
          })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    // Return user without password
    const { hashedPassword: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
