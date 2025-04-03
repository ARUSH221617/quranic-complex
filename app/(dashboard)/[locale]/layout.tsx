import "@/app/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import SessionWrapper from "@/components/SessionWrapper";
import DashboardLayoutClient from "./DashboardLayoutClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khorramshahr Quranic Complex",
  description: "Educational center for Quranic studies",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages({ locale });
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionWrapper>
            <DashboardLayoutClient>{children}</DashboardLayoutClient>
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
