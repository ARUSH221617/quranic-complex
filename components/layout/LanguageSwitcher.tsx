"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations("languageNames")
  const newLocale = locale === "ar" ? "en" : "ar"

  const pathWithoutLocale = pathname.replace(`/${locale}`, "")
  const href = `/${newLocale}${pathWithoutLocale}`

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = href // Force full page navigation
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="flex items-center gap-1"
    >
      <Globe className="h-4 w-4" />
      <span>{t(newLocale)}</span>
    </Button>
  )
}
