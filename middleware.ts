import { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const authAdminMiddleware = withAuth(
  // No need to call intlMiddleware here for admin routes
  // withAuth handles the auth check and redirects if needed
  // If authorized, the request simply proceeds
  {
    callbacks: {
      authorized: ({ token }) => {
        // Check if token exists and user role is admin
        return token?.role === "ADMIN";
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
) as (req: NextRequest) => Promise<Response>;

const authMiddleware = withAuth(
  function middleware(req) {
    return intlMiddleware(req);
  },
  {
    callbacks: {
      authorized: ({ token }) => token != null,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
) as (req: NextRequest) => Promise<Response>;

export default function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Apply auth only to dashboard and admin routes
  if (pathname.startsWith("/admin") || pathname.includes("/admin")) {
    return authAdminMiddleware(req);
  }
  if (pathname.startsWith("/dashboard") || pathname.includes("/dashboard")) {
    return authMiddleware(req);
  }

  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|chat|.*\\..*).*)",
};
