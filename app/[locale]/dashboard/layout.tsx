import type React from "react"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"

export default async function DashboardLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await getServerSession()

  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect(`/${locale}/auth/login`)
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar locale={locale} />
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}

