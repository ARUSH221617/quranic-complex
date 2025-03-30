"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Home, BookOpen, Calendar, User, Settings, LogOut } from "lucide-react"

export default function DashboardSidebar({ locale }: { locale: string }) {
  const pathname = usePathname()

  const navigation = [
    {
      name: locale === "ar" ? "الرئيسية" : "Home",
      href: `/${locale}/dashboard`,
      icon: Home,
    },
    {
      name: locale === "ar" ? "برامجي" : "My Programs",
      href: `/${locale}/dashboard/programs`,
      icon: BookOpen,
    },
    {
      name: locale === "ar" ? "الجدول الدراسي" : "Schedule",
      href: `/${locale}/dashboard/schedule`,
      icon: Calendar,
    },
    {
      name: locale === "ar" ? "الملف الشخصي" : "Profile",
      href: `/${locale}/dashboard/profile`,
      icon: User,
    },
    {
      name: locale === "ar" ? "الإعدادات" : "Settings",
      href: `/${locale}/dashboard/settings`,
      icon: Settings,
    },
  ]

  return (
    <div className="flex h-screen w-64 flex-col bg-secondary text-white">
      <div className="flex h-20 items-center justify-center border-b border-secondary-foreground/10">
        <Link href={`/${locale}`} className="text-xl font-bold">
          {locale === "ar" ? "بوابة الطالب" : "Student Portal"}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-secondary-foreground/20 text-white"
                  : "text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-white"
              }`}
            >
              <item.icon className={`${locale === "ar" ? "ml-3" : "mr-3"} h-5 w-5`} />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-secondary-foreground/10 p-4">
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}` })}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground/70 hover:bg-secondary-foreground/10 hover:text-white"
        >
          <LogOut className={`${locale === "ar" ? "ml-3" : "mr-3"} h-5 w-5`} />
          {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
        </button>
      </div>
    </div>
  )
}

