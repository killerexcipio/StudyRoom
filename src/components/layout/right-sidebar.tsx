
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PanelRightClose, PanelRightOpen, Clock } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar.tsx";
import { useComments } from "@/hooks/use-comments";
import { format, formatDistanceToNow, isFuture } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import * as EventsService from "@/services/events-service";

type Event = {
  id: string;
  title: string;
  event_date: string;
};

function DefaultSidebarContent() {
  const { comments, loading: commentsLoading } = useComments("recent");
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      if (!user) {
        setEvents([]);
        setEventsLoading(false);
        return;
      }
      setEventsLoading(true);
      try {
        const data = await EventsService.fetchUpcomingEvents(user.id);
        const upcoming = data
          .filter(e => isFuture(new Date(e.event_date)))
          .slice(0, 5);
        setEvents(upcoming);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [user]);

  const getDocumentLink = (comment: any) => {
    if (comment.note_id) return `/note/${comment.note_id}`;
    if (comment.whiteboard_id) return `/whiteboard/${comment.whiteboard_id}`;
    return "#";
  };

  const getDocumentTitle = (comment: any) => {
    if (comment.note_title) return comment.note_title;
    if (comment.whiteboard_title) return comment.whiteboard_title;
    return "a document";
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Upcoming Deadlines</h3>
        {eventsLoading ? (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : events.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming deadlines.</p>
        ) : (
            <ul className="space-y-3">
            {events.map(event => (
                <li key={event.id} className="flex items-start space-x-3">
                    <Clock className="text-rose-500 mt-1 h-4 w-4" />
                    <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-500">Due on {format(new Date(event.event_date), "MMM d")}</p>
                    </div>
                </li>
            ))}
            </ul>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Recent Comments</h3>
        {commentsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">No recent comments.</p>
        ) : (
          <ul className="space-y-4">
            {comments.slice(0, 5).map((comment) => (
              <li key={comment.id} className="text-sm">
                <p className="truncate">&quot;{comment.content}&quot;</p>
                <div className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold text-gray-700">
                    {comment.user_id === user?.id
                      ? "You"
                      : comment.user_email}
                  </span>{" "}
                  on{" "}
                  <Link
                    href={getDocumentLink(comment)}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    {getDocumentTitle(comment)}
                  </Link>
                  <span className="ml-2">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function RightSidebar() {
  const { isRightSidebarOpen, toggleRightSidebar, sidebarContent } =
    useSidebar();

  return (
    <aside
      id="right-sidebar"
      className={cn(
        "bg-white border-l border-gray-200 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out relative h-full z-10",
        isRightSidebarOpen ? "w-80" : "w-0",
        "hidden md:flex"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleRightSidebar}
        className="absolute -left-12 top-4 z-20"
      >
        {isRightSidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
      </Button>
      <div
        className={cn(
          "overflow-hidden transition-opacity h-full",
          isRightSidebarOpen ? "opacity-100" : "opacity-0"
        )}
      >
        {sidebarContent || <DefaultSidebarContent />}
      </div>
    </aside>
  );
}
