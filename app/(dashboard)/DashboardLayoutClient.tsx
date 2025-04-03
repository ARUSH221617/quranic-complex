"use client";
import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { LucideMenu } from "lucide-react";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <main>
      <div className="flex min-h-screen">
        <DashboardSidebar collapsed={collapsed} />
        <div className="flex-1 p-8">
          <Button 
            variant={"default"} 
            className="bg-secondary/20 text-secondary-text hover:bg-secondary/50 hover:text-secondary-text px-3"
            onClick={() => setCollapsed(!collapsed)}
          >
            <LucideMenu />
          </Button>
          {children}
        </div>
      </div>
    </main>
  );
}
