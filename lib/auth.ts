import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        // Find user and include roles through the join table
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        })

        if (!user || !user.isActive) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // This is what gets passed as `user` into the jwt callback below
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          // flatten joined roles into simple string[]
          roles: user.roles.map((ur) => ur.role.name),
          isActive: user.isActive,
        }
      },
    }),
  ],

  callbacks: {
    // Shape the JWT token
    async jwt({ token, user }) {
      // When the user has just logged in, `user` is defined
      if (user) {
        const u = user as any

        // NextAuth uses `sub` as the primary user id
        token.sub = u.id
        ;(token as any).id = u.id

        token.email = u.email
        token.name = u.name

        ;(token as any).isActive = u.isActive
        ;(token as any).roles = u.roles || []
      }

      return token
    },

    // Shape the session sent to the browser
    async session({ session, token }) {
      if (session.user) {
        // Use sub (preferred) or id from token
        ;(session.user as any).id = (token as any).sub ?? (token as any).id
        session.user.email = token.email as string | undefined
        session.user.name = token.name as string | undefined

        ;(session.user as any).isActive = (token as any).isActive
        ;(session.user as any).roles = (token as any).roles || []
      }

      return session
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
}
