import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      roles: string[]
      isActive: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    roles: string[]
    isActive: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    roles: string[]
    isActive: boolean
  }
}