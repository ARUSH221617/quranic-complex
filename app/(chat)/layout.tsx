import "@/app/globals.css";
import SessionWrapper from "@/components/SessionWrapper";
import type { Metadata } from "next";
import { CookiesProvider } from "next-client-cookies/server";
import { SidebarInset, SidebarProvider } from "@/components/ai/ui/sidebar";
import { AppSidebarWrapper } from "@/components/ai/app-sidebar-wrapper";
import Script from "next/script";
import { ThemeProvider } from "@/components/ai/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Khorramshahr Quranic Complex",
  description: "Educational center for Quranic studies",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookie] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);
  const defaultOpen = cookie.get("sidebar:state")
    ? cookie.get("sidebar:state")?.toString() !== "true"
    : true;

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="w-[100vw] h-screen">
        <SessionWrapper>
          <CookiesProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Toaster position="top-center" />
              <SidebarInset>
                <SidebarProvider defaultOpen={defaultOpen}>
                  <AppSidebarWrapper user={session?.user} />
                  {children}
                </SidebarProvider>
              </SidebarInset>
            </ThemeProvider>
          </CookiesProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
