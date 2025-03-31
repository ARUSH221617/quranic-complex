import NextAuth from "next-auth"
import { User as AuthUser } from "@auth/core/types"

declare module "next-auth" {
  interface Session {
    user: AuthUser & {
      id: string
      role?: string
    }
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends AuthUser {
    id: string
    role?: string
  }
}
