"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, User } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import LanguageSwitcher from "./LanguageSwitcher"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const locale = useLocale()
  const t = useTranslations("navigation")

  // Navigation items that will re-render when locale changes
  const navigation = [
    { name: t("home"), href: `/${locale}` },
    { name: t("about"), href: `/${locale}/about` },
    { name: t("programs"), href: `/${locale}/programs` },
    { name: t("news"), href: `/${locale}/news` },
    { name: t("gallery"), href: `/${locale}/gallery` },
    { name: t("contact"), href: `/${locale}/contact` },
  ]

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex items-center">
              <span className="sr-only">Khorramshahr Quranic Complex</span>
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-primary/10">
                <div className="flex h-full w-full items-center justify-center text-primary">
                  <span className="text-xl font-bold">{locale === "ar" ? "قرآن" : "Q"}</span>
                </div>
              </div>
              <span className={`${locale === "ar" ? "me-3" : "ms-3"} text-xl font-serif font-bold text-secondary`}>
                {locale === "ar" ? "مجمع قرآنی خرمشهر" : "Khorramshahr Quranic Complex"}
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4 md:space-x-reverse">
            <div className="flex items-center space-x-4 space-x-reverse">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-2 space-x-reverse border-s border-gray-200 ps-4">
              <Link
                href={`/${locale}/auth/login`}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
              >
                <User className="mr-1 h-4 w-4" />
                {t("login")}
              </Link>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 space-x-reverse md:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-primary/10 hover:text-primary focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">{mobileMenuOpen ? "Close menu" : "Open menu"}</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href={`/${locale}/auth/login`}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("login")}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
