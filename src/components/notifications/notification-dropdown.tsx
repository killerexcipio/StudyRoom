import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
  } from "@/components/ui/dropdown-menu";
  import { useComments } from "@/hooks/use-comments";
  import { useAuth } from "@/context/auth-context";
  import { getSupabase } from "@/lib/supabase";
  import { useEffect, useState } from "react";
  import { Skeleton } from "../ui/skeleton";
  import Link from "next/link";
  import { MessageSquare, CalendarClock } from "lucide-react";
  import { format, isFuture } from "date-fns";
  
  type Event = {
      id: string;
      title: string;
      event_date: string;
  };
  
  export default function NotificationDropdown() {
    const { user } = useAuth();
    const { comments, loading: commentsLoading } = useComments("recent");
    const [events, setEvents] = useState<Event[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const supabase = getSupabase();
  
    useEffect(() => {
        const fetchUpcomingEvents = async () => {
          if (!user) {
            setEvents([]);
            setEventsLoading(false);
            return;
          }
          setEventsLoading(true);
          const { data, error } = await supabase
            .from("events")
            .select("id, title, event_date")
            .or(`user_id.eq.${user.id},collaborators.cs.{${user.id}}`)
            .order("event_date", { ascending: true });
          
          if (error) {
            console.error("Error fetching events:", error);
            setEvents([]);
          } else {
            const upcoming = data
              .filter(e => isFuture(new Date(e.event_date)))
              .slice(0, 5);
            setEvents(upcoming);
          }
          setEventsLoading(false);
        };
    
        fetchUpcomingEvents();
      }, [user, supabase]);
  
    const getDocumentLink = (comment: any) => {
      if (comment.note_id) return `/note/${comment.note_id}`;
      if (comment.whiteboard_id) return `/whiteboard/${comment.whiteboard_id}`;
      return "#";
    };
  
    const getDocumentTitle = (comment: any) => {
      if(comment.note_title) return `"${comment.note_title}"`;
      if(comment.whiteboard_title) return `"${comment.whiteboard_title}"`;
      return "a document";
    }
  
    const isLoading = commentsLoading || eventsLoading;
    const hasNotifications = comments.length > 0 || events.length > 0;
  
    return (
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
            <div className="p-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        ) : !hasNotifications ? (
            <p className="p-4 text-sm text-gray-500 text-center">No new notifications.</p>
        ) : (
          <>
            {events.map(event => (
              <Link href="/calendar" key={event.id}>
                <DropdownMenuItem className="flex items-start gap-3">
                  <CalendarClock className="h-4 w-4 text-rose-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm leading-tight">Task Due: {event.title}</p>
                    <p className="text-xs text-gray-500">
                      Due on {format(new Date(event.event_date), 'MMM d')}
                    </p>
                  </div>
                </DropdownMenuItem>
              </Link>
            ))}
            {comments.slice(0, 5).map(comment => (
                 <Link href={getDocumentLink(comment)} key={comment.id}>
                    <DropdownMenuItem className="flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 text-sky-500 mt-1 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-sm leading-tight">New comment</p>
                            <p className="text-xs text-gray-500">
                                <span className="font-semibold">{comment.user_id === user?.id ? 'You' : comment.user_email}</span> on {getDocumentTitle(comment)}
                            </p>
                        </div>
                    </DropdownMenuItem>
                </Link>
            ))}
          </>
        )}
      </DropdownMenuContent>
    );
  }
