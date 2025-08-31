
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import EventDetailsDialog from "./event-details-dialog";
import NewEventDialog from "./new-event-dialog";
import * as EventsService from "@/services/events-service";
import type { CalendarEvent } from "@/services/events-service";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | undefined>(undefined);

  const fetchAndSetEvents = useCallback(async () => {
    if (!user) return;
    try {
      const fetchedEvents = await EventsService.fetchEvents(user.id);
      setEvents(fetchedEvents);
    } catch (error) {
      toast({
        title: "Error fetching events",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAndSetEvents();
  }, [fetchAndSetEvents]);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  const startingDayIndex = getDay(firstDayOfMonth);

  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      const date = event.event_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(null);
    setEventToEdit(event);
    setIsEventFormOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
        await EventsService.deleteEvent(eventId);
        toast({ title: "Event deleted successfully."});
        setSelectedEvent(null);
        fetchAndSetEvents();
    } catch (error) {
        toast({
            title: "Error deleting event",
            description: (error as Error).message,
            variant: "destructive",
        });
    }
  };

  const handleOpenNewEventDialog = () => {
    setEventToEdit(undefined);
    setIsEventFormOpen(true);
  };
  
  const handleEventFormClose = () => {
    setIsEventFormOpen(false);
    setEventToEdit(undefined);
    fetchAndSetEvents();
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col h-full">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {format(currentDate, "MMMM yyyy")}
          </h1>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleToday}>Today</Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-7 flex-1 border-t border-l border-gray-200 bg-white">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center py-3 border-r border-b border-gray-200 text-sm font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayIndex }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="border-r border-b border-gray-200"
          />
        ))}

        {daysInMonth.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dayKey] || [];
          return (
            <div
              key={day.toString()}
              className="p-2 border-r border-b border-gray-200 text-right relative min-h-[120px]"
            >
              <span
                className={cn(
                  "font-semibold",
                  !isSameMonth(day, currentDate) && "text-gray-400",
                  isToday(day) && "bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center float-right"
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-8 space-y-1">
                {dayEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="bg-sky-100 text-sky-800 text-xs text-left p-1 rounded-md truncate cursor-pointer hover:bg-sky-200"
                      onClick={() => setSelectedEvent(event)}
                    >
                        {event.title}
                    </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {selectedEvent && (
        <EventDetailsDialog
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}
      <NewEventDialog
        isOpen={isEventFormOpen}
        onClose={handleEventFormClose}
        eventToEdit={eventToEdit}
      />
    </div>
  );
}
