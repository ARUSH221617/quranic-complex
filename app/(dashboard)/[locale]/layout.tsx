import "@/app/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import SessionWrapper from "@/components/SessionWrapper";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { Bell } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { CookiesProvider } from "next-client-cookies/server";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { getDashboardAnnouncements } from "@/app/actions/getDashboardAnnouncements";
import AIPanelWrapper from "@/components/ai/AIPanelWrapper";
import AIPanelButton from "@/components/ai/AIPanelButton";
import { AIPanelProvider } from "@/components/ai/AIPanelContext";

export const metadata: Metadata = {
  title: "Khorramshahr Quranic Complex",
  description: "Educational center for Quranic studies",
};

function formatAnnouncementDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d";
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString();
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });
  const dir = locale === "ar" || locale === "fa" ? "rtl" : "ltr";

  // Fetch dashboard announcements dynamically (server action)
  const announcements = await getDashboardAnnouncements(3);

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <CookiesProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <Toaster />
            <NextIntlClientProvider locale={locale} messages={messages}>
              <AIPanelProvider>
                <SessionWrapper>
                  <AIPanelWrapper>
                    <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden font-['Public_Sans','Noto_Sans',sans-serif]">
                      <div className="layout-container flex h-full grow flex-col">
                        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
                          <div className="flex flex-col flex-1">
                            <header className="flex justify-center border-b border-solid border-slate-200 px-10 py-4">
                              <div className="layout-content-container flex items-center justify-between whitespace-nowrap max-w-[960px] flex-1">
                                <div className="flex items-center gap-3 text-slate-800">
                                  <h1
                                    className="text-slate-800 text-xl font-bold leading-tight tracking-tight"
                                    style={{
                                      fontFamily: '"Noto Serif", serif',
                                    }}
                                  >
                                    Quranic Complex
                                  </h1>
                                </div>
                                <nav className="flex items-center gap-6">
                                  <Link
                                    className="text-slate-600 hover:text-primary text-sm font-medium leading-normal transition-colors"
                                    href="/dashboard"
                                  >
                                    Dashboard
                                  </Link>
                                  <Link
                                    className="text-slate-600 hover:text-primary text-sm font-medium leading-normal transition-colors"
                                    href="/courses"
                                  >
                                    Courses
                                  </Link>
                                  <Link
                                    className="text-slate-600 hover:text-primary text-sm font-medium leading-normal transition-colors"
                                    href="/progress"
                                  >
                                    Progress
                                  </Link>
                                  <Link
                                    className="text-slate-600 hover:text-primary text-sm font-medium leading-normal transition-colors"
                                    href="/schedule"
                                  >
                                    Schedule
                                  </Link>
                                </nav>
                                <div className="flex items-center gap-4">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className="relative flex items-center justify-center rounded-full h-10 w-10 hover:bg-surface-variant text-on-white-variant transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 group"
                                        aria-label="Notifications"
                                      >
                                        <Bell size={24} />
                                        {/* Minimal notification dot */}
                                        {announcements.length > 0 && (
                                          <span className="absolute top-2 right-2 block h-1.5 w-1.5 rounded-full bg-primary" />
                                        )}
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-72 p-0 overflow-hidden shadow-lg border border-outline-variant rounded-lg bg-white animate-in fade-in-0 zoom-in-95"
                                    >
                                      <DropdownMenuLabel className="px-4 pt-3 pb-1 text-sm font-medium text-on-surface-variant tracking-wide">
                                        Notifications
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator className="bg-outline-variant" />
                                      <div className="max-h-56 overflow-y-auto divide-y divide-outline-variant bg-surface">
                                        {announcements.length === 0 && (
                                          <div className="px-4 py-6 text-center text-xs text-on-surface-variant opacity-70">
                                            No announcements.
                                          </div>
                                        )}
                                        {announcements.map((a) => (
                                          <DropdownMenuItem
                                            key={a.id}
                                            className="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low cursor-pointer transition-colors"
                                          >
                                            <span className="text-on-surface-variant text-base">
                                              📢
                                            </span>
                                            <span className="flex-1 text-on-surface text-sm truncate">
                                              {a.title}
                                            </span>
                                            <span className="text-xs text-on-surface-variant">
                                              {formatAnnouncementDate(a.date)}
                                            </span>
                                          </DropdownMenuItem>
                                        ))}
                                      </div>
                                      <DropdownMenuSeparator className="bg-outline-variant" />
                                      <DropdownMenuItem className="justify-center text-primary hover:underline cursor-pointer py-2 text-xs font-medium bg-surface-container-low">
                                        View all
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <AIPanelButton />
                                  <button className="flex items-center justify-center rounded-full h-10 w-10 hover:bg-slate-100 text-slate-600 hover:text-[#0c77f2] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0c77f2]/40">
                                    <svg
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M4 6H20M4 12H20M4 18H20"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </header>
                            <div className="flex justify-center">
                              <div className="layout-content-container flex flex-col max-w-[960px]">
                                {children}
                              </div>
                            </div>
                          </div>
                        </div>
                        <footer className="flex justify-center">
                          <div className="flex max-w-[960px] flex-1 flex-col">
                            <footer className="flex flex-col gap-6 px-5 py-10 text-center @container">
                              <div className="flex flex-wrap items-center justify-center gap-6 @[480px]:flex-row @[480px]:justify-around">
                                <a
                                  className="text-[#57738e] text-base font-normal leading-normal min-w-40"
                                  href="/about"
                                >
                                  About Us
                                </a>
                                <a
                                  className="text-[#57738e] text-base font-normal leading-normal min-w-40"
                                  href="/contact"
                                >
                                  Contact
                                </a>
                                <a
                                  className="text-[#57738e] text-base font-normal leading-normal min-w-40"
                                  href="#"
                                >
                                  Privacy Policy
                                </a>
                              </div>
                              <p className="text-[#57738e] text-base font-normal leading-normal">
                                © 2024 Quranic Complex. All rights reserved.
                              </p>
                            </footer>
                          </div>
                        </footer>
                      </div>
                    </div>
                  </AIPanelWrapper>
                </SessionWrapper>
              </AIPanelProvider>
            </NextIntlClientProvider>
          </ThemeProvider>
        </CookiesProvider>
      </body>
    </html>
  );
}
