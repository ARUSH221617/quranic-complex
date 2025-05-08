import NextAuth, { AuthOptions, DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { JWT } from "next-auth/jwt";

interface ExtendedSession extends DefaultSession {
  user: {
    id: string;
    role?: string;
  } & DefaultSession["user"];
}

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Provider 1: Email + Password (Original)
    CredentialsProvider({
      id: "credentials", // Explicit ID
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log("No user found with this email");
          return null;
        }

        // Check if email is verified *before* checking password
        if (!user.emailVerified) {
          console.log(
            "Attempt to login with unverified email (password flow):",
            user.email
          );
          throw new Error("Email not verified");
        }

        // Check password
        if (!user.password) {
          console.error(
            "User model missing password field or password not set for user:",
            user.email
          );
          // Throw error instead of returning null to provide feedback
          throw new Error("Password not set for user");
        }
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          console.log("Invalid password for user:", user.email);
          // Throw error instead of returning null
          throw new Error("Invalid credentials");
        }

        // Password is valid and email is verified
        console.log("Password check passed for user:", user.email);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    // Provider 2: Email + Login Code (New)
    CredentialsProvider({
      id: "email-code", // Unique ID for this provider
      name: "Email Code",
      credentials: {
        email: { label: "Email", type: "email" },
        loginCode: { label: "Login Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.loginCode) {
          console.log("Missing email or login code");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          console.log("No user found for email code login:", credentials.email);
          return null;
        }

        // Check if code exists, matches, and hasn't expired FIRST
        const now = new Date();
        if (
          !user.loginCode ||
          !user.loginCodeExpires ||
          user.loginCode !== credentials.loginCode ||
          now > user.loginCodeExpires
        ) {
          if (now > (user.loginCodeExpires ?? new Date(0))) {
            console.log("Login code expired for user:", user.email);
            // Optionally clear expired code here
            await prisma.user.update({
              where: { email: credentials.email },
              data: { loginCode: null, loginCodeExpires: null },
            });
            throw new Error("Login code expired");
          }
          console.log("Invalid or missing login code for user:", user.email);
          throw new Error("Invalid login code");
          // return null;
        }

        // Code is valid. Verify email if not already verified.
        let userDataUpdate: {
          loginCode: null;
          loginCodeExpires: null;
          emailVerified?: Date;
        } = {
          loginCode: null,
          loginCodeExpires: null,
        };
        if (!user.emailVerified) {
          console.log("Verifying email via code login for:", user.email);
          userDataUpdate.emailVerified = now; // Set verification timestamp
        }

        // Clear the code and potentially update verification status
        await prisma.user.update({
          where: { email: credentials.email },
          data: userDataUpdate,
        });

        console.log("Email code login successful for:", user.email);
        // Return necessary user fields
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Ensure session callback includes necessary user data from token/user
    // JWT callback is not typically needed when using database sessions
    // async jwt({ token, user }) {
    //   if (user) {
    //     // Add custom properties to token if needed
    //   }
    //   return token
    // },
    async session({ session, token }: { session: ExtendedSession; token: JWT }) {
      // Using JWT strategy, user object might not be passed directly here.
      // We rely on the token which gets info from authorize() and jwt callback.
      if (token && session.user) {
        session.user.id = token.sub ?? session.user.id; // Add id from token subject
        // @ts-ignore // Add role if persisted in token by jwt callback
        session.user.role = token.role ?? session.user.role;
        // Add other properties from token if needed
      }
      return session;
    },
    // JWT callback is needed with JWT strategy to persist custom data (like role)
    async jwt({ token, user }: { token: JWT; user: any }) {
      // On sign in, 'user' object is passed from authorize()
      if (user) {
        token.sub = user.id; // Persist user id
        // @ts-ignore // Persist user role
        token.role = user.role;
        // Persist other fields if needed
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/login", // Your custom login page path
    error: "/auth/error", // Error page, errors passed via query ?error=...
    // verifyRequest: '/auth/verify-request', // Page shown after requesting email verification (built-in provider) - Not needed for our custom flow
  },
  session: {
    strategy: "jwt" as const, // Fix the session strategy type
    maxAge: 30 * 24 * 60 * 60, // 30 days session expiry
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET, // Secret for signing JWTs
  },
  secret: process.env.NEXTAUTH_SECRET, // Top-level secret also needed
  debug: process.env.NODE_ENV === "development", // Enable debug logs in development
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
