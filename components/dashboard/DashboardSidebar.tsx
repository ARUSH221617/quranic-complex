"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  BookOpen,
  Calendar,
  User,
  Settings,
  LogOut,
  LucideMenu,
  LucideArrowRight,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardSidebarProps {
  collapsed?: boolean;
  setCollapsed: (arg0: boolean) => void;
}

export default function DashboardSidebar({
  collapsed = false,
  setCollapsed,
}: DashboardSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("dashboard.sidebar");
  const locale = useLocale();
  const IsMobile = useIsMobile();

  const navigation = [
    {
      name: t("home"),
      href: `/dashboard`,
      icon: Home,
    },
    {
      name: t("programs"),
      href: `/dashboard/programs`,
      icon: BookOpen,
    },
    {
      name: t("schedule"),
      href: `/dashboard/schedule`,
      icon: Calendar,
    },
    {
      name: t("profile"),
      href: `/dashboard/profile`,
      icon: User,
    },
    {
      name: t("settings"),
      href: `/dashboard/settings`,
      icon: Settings,
    },
  ];

  return (
    <div
      className={`fixed flex h-screen md:relative flex-col bg-secondary text-primary transition-all duration-300 ${
        collapsed ? "w-0 overflow-hidden" : "w-64"
      }`}
    >
      {IsMobile && (
        <Button
          variant={"default"}
          className={cn(
            "bg-secondary/20 text-secondary-text hover:bg-secondary/50 hover:text-secondary-text px-3",
            collapsed ? "" : "absolute left-0 -translate-x-12 top-2"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          <LucideArrowRight />
        </Button>
      )}
      <div className="flex h-24 items-center justify-center border-b border-secondary-foreground/10 px-4">
        <Link href={`/`} className="flex items-center gap-2 text-xl font-bold">
          <Image
            src="/logo.webp"
            alt="Logo"
            width={150}
            height={150}
            className="h-10 w-10 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-logo.webp";
            }}
          />
          {t("brand")}
        </Link>
      </div>
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors duration-200 ${
                isActive
                  ? "shadow-md"
                  : "text-secondary-text-foreground/80 hover:bg-secondary-foreground/10 hover:text-white"
              }`}
            >
              <item.icon
                className={`${locale === "ar" ? "ml-3" : "mr-3"} h-5 w-5`}
              />
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-secondary-foreground/10 px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary-foreground/10 cursor-pointer transition-colors duration-200">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image ?? "/placeholder-user.jpg"}
                    alt="Profile"
                  />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <span className="text-sm font-semibold text-secondary-text-foreground/80 !text-secondary-text-foreground">
                    {session?.user?.name || t("user")}
                  </span>
                )}
              </div>
              <div className="flex items-center">
                <LucideMenu className="h-5 w-5 text-secondary-text-foreground/80 !text-secondary-text-foreground" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={locale === "ar" ? "start" : "end"}
            className="w-56 bg-card"
          >
            <DropdownMenuItem onClick={() => router.push(`/dashboard/profile`)}>
              <User className="mr-2 h-4 w-4" />
              <span>{t("userMenu.profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: `/` })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("userMenu.logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
