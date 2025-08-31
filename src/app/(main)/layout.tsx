"use client";

import ProtectedRoute from "@/components/auth/protected-route";
import LeftSidebar from "@/components/layout/left-sidebar";
import MainContent from "@/components/layout/main-content";
import RightSidebar from "@/components/layout/right-sidebar";
import type { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <LeftSidebar />
        <MainContent>{children}</MainContent>
        <RightSidebar />
      </div>
    </ProtectedRoute>
  );
}
