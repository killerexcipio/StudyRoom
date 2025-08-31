import type { ReactNode } from "react";
import MobileHeader from "./mobile-header";

export default function MainContent({ children }: { children: ReactNode }) {
  return (
    <main
      id="main-content"
      className="flex-1 flex flex-col overflow-y-auto bg-white"
    >
      <MobileHeader />
      {children}
    </main>
  );
}
