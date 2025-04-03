import type React from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import type { Metadata } from "next";
import "@/app/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import SessionWrapper from "@/components/SessionWrapper";

export const metadata: Metadata = {
  title: "Khorramshahr Quranic Complex",
  description: "Educational center for Quranic studies",
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionWrapper>
            <main>
              <div className="flex min-h-screen">
                <DashboardSidebar locale={locale} />
                <div className="flex-1 p-8">{children}</div>
              </div>
            </main>
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
