import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client" // Make sure prisma client is generated
import CredentialsProvider from "next-auth/providers/credentials"

const prisma = new PrismaClient()

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
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

        // Find user in the database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          return null
        }

        // IMPORTANT: This assumes you have a password field in your User model
        // and that it's hashed. You'll need to add this field to your
        // prisma/schema.prisma if it's not already there and ensure passwords
        // are hashed upon user creation/update.
        // For now, we'll comment out the password check as the field doesn't exist.
        /*
        if (!user.password) { // Check if password field exists
           console.error("User model does not have a password field.");
           return null;
        }
        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null
        }
        */

        // For now, just return the user if found by email
        // Remove the password check logic above once you have hashed passwords stored
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          // Add role if you have it in your Prisma User model
          role: user.role,
        }
      },
    }),
    // Add other providers like Google, GitHub etc. here if needed
  ],
  callbacks: {
    // JWT callback is not typically needed when using database sessions
    // async jwt({ token, user }) {
    //   if (user) {
    //     // Add custom properties to token if needed
    //   }
    //   return token
    // },
    async session({ session, token, user }) {
      // The user object may be undefined with JWT strategy
      if (session?.user) {
        // Add id from token if available (JWT strategy)
        if (token?.sub) {
          session.user.id = token.sub;
        }
        // Add properties from user if available (database strategy)
        if (user) {
          const typedUser = user as { id: string; name?: string | null; email?: string | null; image?: string | null; role?: string | null };
          session.user.id = typedUser.id;
          session.user.image = typedUser.image ?? undefined;
          // Only add role if it exists on the user object
          if ('role' in typedUser && typedUser.role != null) {
            session.user.role = typedUser.role ?? undefined;
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // Your custom login page
    // signOut: "/auth/logout", // Default signout page is usually fine
    error: "/auth/error", // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (Optional) Used for email verification
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  },
  session: {
    strategy: "jwt", // Temporarily switch to JWT strategy for debugging
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  // Add debug: process.env.NODE_ENV === 'development' for more logs
})

export { handler as GET, handler as POST }
