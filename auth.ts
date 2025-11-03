import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

export { GET, POST, auth, signIn, signOut };
