"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, User } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import Image from "next/image";
import { useSession } from "next-auth/react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("navigation");
  const { data: session, status: loginStatus } = useSession();
  const loggedIn = loginStatus === "authenticated";

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      if (mobileMenuOpen) setMobileMenuOpen(false);
    };

    // Close mobile menu on resize (when switching to desktop view)
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  // Navigation items that will re-render when locale changes
  const navigation = [
    { name: t("home"), href: `/${locale}` },
    { name: t("about"), href: `/${locale}/about` },
    { name: t("programs"), href: `/${locale}/programs` },
    { name: t("news"), href: `/${locale}/news` },
    { name: t("gallery"), href: `/${locale}/gallery` },
    { name: t("contact"), href: `/${locale}/contact` },
  ];

  // Stop event propagation for the menu to prevent it from closing when clicking inside
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav
        className="container mx-auto px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex h-16 sm:h-18 md:h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href={`/${locale}`} className="flex items-center">
              <span className="sr-only">Tehran Charity</span>
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full bg-primary/10">
                <Image
                  src={"/logo.webp"}
                  alt="Tehran Charity Logo"
                  width={150}
                  height={150}
                  className="h-full w-full object-cover"
                  onLoad={(e) => {
                    e.currentTarget.nextElementSibling?.classList.add("hidden");
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove(
                      "hidden"
                    );
                  }}
                />
                <div className="flex h-full w-full items-center justify-center text-primary">
                  <span className="text-lg sm:text-xl font-bold">
                    {locale === "ar" ? "قرآن" : "Q"}
                  </span>
                </div>
              </div>
              <span
                className={`hidden sm:block ${
                  locale === "ar" ? "me-3" : "ms-3"
                } text-base sm:text-lg md:text-xl font-serif font-bold text-secondary-text`}
              >
                {t("brand")}
              </span>
            </Link>
          </div>

          {/* Desktop navigation - visible from md breakpoint */}
          <div className="hidden md:flex md:items-center md:space-x-4 md:space-x-reverse">
            <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="rounded-md px-2 sm:px-3 py-2 text-sm sm:text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-2 space-x-reverse border-s border-gray-200 ps-2 sm:ps-4">
              {!loggedIn && (
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex items-center rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                >
                  <User className="mr-1 h-4 w-4" />
                  {t("login")}
                </Link>
              )}
              {loggedIn && (
                <Link
                  href={`/${locale}/dashboard`}
                  className="flex items-center rounded-md px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                >
                  <User className="mr-1 h-4 w-4" />
                  <span className="max-w-[100px] truncate">{session.user?.name}</span>
                </Link>
              )}
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 space-x-reverse md:hidden">
            <LanguageSwitcher />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-primary/10 hover:text-primary focus:outline-none transition-colors duration-200"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
            >
              <span className="sr-only">
                {mobileMenuOpen ? "Close menu" : "Open menu"}
              </span>
              {mobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu with animation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}
          onClick={handleMenuClick}
        >
          <div className="space-y-1 px-2 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm sm:text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {!loggedIn ? (
              <Link
                href={`/${locale}/auth/login`}
                className="block rounded-md px-3 py-2 text-sm sm:text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <User className="mr-1 h-4 w-4" />
                  {t("login")}
                </span>
              </Link>
            ) : (
              <Link
                href={`/${locale}/dashboard`}
                className="block rounded-md px-3 py-2 text-sm sm:text-base font-medium text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <User className="mr-1 h-4 w-4" />
                  {session.user?.name}
                </span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
