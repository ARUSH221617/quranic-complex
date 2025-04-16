"use client";

import { ComponentProps } from "react";
import {
  ArrowUpCircleIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  BotIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "User Management",
      url: "/admin/user",
      icon: UsersIcon,
    },
    {
      title: "Program Management",
      url: "/admin/programs",
      icon: ClipboardListIcon,
    },
    {
      title: "News Management",
      url: "/admin/news",
      icon: FileTextIcon,
    },
    {
      title: "Contact Management",
      url: "/admin/contact",
      icon: DatabaseIcon,
    },
    {
      title: "AI Agent",
      url: "/admin/ai-agent",
      icon: BotIcon,
    },
  ],
  navSecondary: [
    {
      title: "Admin Settings",
      url: "/admin/settings",
      icon: SettingsIcon,
    },
    {
      title: "Help Page",
      url: "/admin/help",
      icon: HelpCircleIcon,
    },
  ],
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Arush.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
