
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  note_id: string | null;
  collaborators: string[];
};

export const fetchEvents = async (userId: string) => {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, event_date, event_time, note_id, collaborators")
    .or(`user_id.eq.${userId},collaborators.cs.{${userId}}`);

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
  return data || [];
};

export const fetchUpcomingEvents = async (userId: string) => {
    const { data, error } = await supabase
        .from("events")
        .select("id, title, event_date")
        .or(`user_id.eq.${userId},collaborators.cs.{${userId}}`)
        .order("event_date", { ascending: true });
    
    if (error) {
        console.error("Error fetching upcoming events:", error);
        throw error;
    }
    return data || [];
};

type EventData = {
    user_id: string;
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    note_id: string | null;
    collaborators: string[];
};

export const addEvent = async (eventData: EventData) => {
  const { error } = await supabase.from("events").insert(eventData);
  if (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, eventData: Partial<EventData>) => {
    const { error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", eventId);
    if (error) {
        console.error("Error updating event:", error);
        throw error;
    }
};

export const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);
    if (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
};
