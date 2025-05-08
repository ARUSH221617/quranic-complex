'use client';

import { AppSidebar } from './app-sidebar';

export function AppSidebarWrapper({ user }: { user: any }) {
  return <AppSidebar user={user} />;
}