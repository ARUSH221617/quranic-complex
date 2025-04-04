"use client";
import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { LucideArrowRight, LucideMenu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const IsMobile = useIsMobile();

  return (
    <main>
      <div className="flex min-h-screen">
        <DashboardSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex-1 p-8">
          <Button
            variant={"default"}
            className={cn(
              "bg-secondary/20 text-secondary-text hover:bg-secondary/50 hover:text-secondary-text px-3",
              IsMobile && !collapsed && "hidden"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed && <LucideMenu />}
            {!collapsed && <LucideArrowRight />}
          </Button>
          {children}
        </div>
      </div>
    </main>
  );
}
