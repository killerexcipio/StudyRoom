"use client";

import { cn } from "@/lib/utils";
import { FileText, LayoutDashboard, Calendar, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "My Notes", icon: FileText },
  { href: "/whiteboards", label: "Whiteboards", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar View", icon: Calendar },
  { href: "/public-library", label: "Public Library", icon: Globe, isNew: true },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {navItems.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-gray-600 hover:bg-gray-100",
              pathname === item.href && "active-nav"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.isNew && (
              <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
