import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"

// This is a mock user database - in a real app, you would use a database
const users = [
  {
    id: "1",
    name: "محمد أحمد",
    email: "student@example.com",
    password: "$2b$10$8OxDlUUQpBe5oxFBY7.WTO/ejJH8.9yAkmXbRbQKlsB7QUxH0eJwi", // "password123"
    role: "student",
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@example.com",
    password: "$2b$10$8OxDlUUQpBe5oxFBY7.WTO/ejJH8.9yAkmXbRbQKlsB7QUxH0eJwi", // "password123"
    role: "admin",
  },
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = users.find((user) => user.email === credentials.email)
        if (!user) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }

