
"use client";

import { Bell, LogOut, Plus, Search } from "lucide-react";
import NotificationDropdown from "../notifications/notification-dropdown";
import NavLinks from "./nav-links";
import Tags from "./tags";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { useNotes } from "@/context/notes-context";
import { useAuth } from "@/context/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import NewEventDialog from "../views/new-event-dialog";
import { useToast } from "@/hooks/use-toast";
import * as WhiteboardService from "@/services/whiteboard-service";

export default function LeftSidebar() {
  const { addNote, searchQuery, setSearchQuery } = useNotes();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleNewNote = async () => {
    const newNoteId = await addNote({
      title: "New Note",
      content: "Start writing your new note here...",
      tags: [],
      type: "text",
    });
    if (newNoteId) {
      router.push(`/note/${newNoteId}`);
    }
  };

  const handleNewWhiteboard = async () => {
    if (!user) {
        toast({
            title: "Authentication Error",
            description: "You must be logged in to create a whiteboard.",
            variant: "destructive",
        });
        return;
    }
    try {
        const data = await WhiteboardService.createWhiteboard(user.id);
        if (data) {
            router.push(`/whiteboard/${data.id}`);
        }
    } catch (error) {
        toast({
            title: "Error creating whiteboard",
            description: (error as Error).message,
            variant: "destructive",
        });
    }
  };

  const handleNewEvent = () => {
    setIsEventDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const getButtonAction = () => {
    if (pathname.startsWith("/whiteboard")) {
      return handleNewWhiteboard;
    }
    if (pathname === "/calendar") {
      return handleNewEvent;
    }
    return handleNewNote;
  };

  const getButtonText = () => {
    if (pathname.startsWith("/whiteboard")) {
      return "New Whiteboard";
    }
    if (pathname === "/calendar") {
      return "New Event";
    }
    return "New Note";
  };

  return (
    <aside
      id="left-sidebar"
      className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out absolute md:relative z-20 h-full"
    >
      {/* Profile & New Button */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm truncate max-w-[120px]">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 rounded-full"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <NotificationDropdown />
          </DropdownMenu>
        </div>
        <Button
          onClick={getButtonAction()}
          className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>{getButtonText()}</span>
        </Button>
      </div>

      {/* Universal Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Navigation Links & Tags */}
      <nav className="flex-1 px-4 overflow-y-auto">
        <NavLinks />
        <Tags />
      </nav>
      <NewEventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
      />
    </aside>
  );
}
