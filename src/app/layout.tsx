import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { NotesProvider } from "@/context/notes-context";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import { WhiteboardStateProvider } from "@/hooks/use-whiteboard";
import { SidebarProvider } from "@/hooks/use-sidebar.tsx";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Study Room - Your Digital Workspace",
  description: "Collaborate on notes in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.className,
          "h-screen overflow-hidden antialiased text-gray-800"
        )}
      >
        <AuthProvider>
          <NotesProvider>
            <WhiteboardStateProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </WhiteboardStateProvider>
            <Toaster />
          </NotesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
