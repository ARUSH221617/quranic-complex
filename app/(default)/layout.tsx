import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import SessionWrapper from "@/components/SessionWrapper";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Tehran Charity",
  description: "A charity organization dedicated to helping those in need.",
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
          <SessionWrapper>
            <Header />
            <main>{children}</main>
            <Footer />
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
