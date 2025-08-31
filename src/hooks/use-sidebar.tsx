"use client";

import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useMemo,
} from "react";

type SidebarContextType = {
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  sidebarContent: ReactNode | null;
  setSidebarContent: (content: ReactNode | null) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [sidebarContent, setSidebarContent] = useState<ReactNode | null>(null);

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen((prev) => !prev);
  };

  const value = useMemo(
    () => ({
      isRightSidebarOpen,
      toggleRightSidebar,
      sidebarContent,
      setSidebarContent,
    }),
    [isRightSidebarOpen, sidebarContent]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
