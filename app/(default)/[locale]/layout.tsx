import type { Metadata } from "next";
import "@/app/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
            <Header />
            <main>{children}</main>
            <Footer />
          </SessionWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
