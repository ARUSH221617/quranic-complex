import "@/app/globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import SessionWrapper from "@/components/SessionWrapper";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";

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
  const dir = locale === "ar" || locale === "fa" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        <Toaster />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionWrapper>{children}</SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
