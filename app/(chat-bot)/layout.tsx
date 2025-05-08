import type { Metadata } from "next";
import "@/app/globals.css";
import "@/styles/tiptap.css";
import SessionWrapper from "@/components/SessionWrapper";
import { QueryProvider } from "@/components/providers/QueryProvider"; // Import QueryProvider
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "AI Chatbot - Khorramshahr Quranic Complex",
  description: "Interactive AI assistant for Quranic studies and inquiries",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={"en"} dir={"ltr"}>
      <body>
        <Toaster />
        <SessionWrapper>
          <QueryProvider>
            <main>{children}</main>
          </QueryProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
