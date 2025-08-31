
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, UserPlus, X } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotes } from "@/context/notes-context";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card } from "../ui/card";
import * as EventsService from "@/services/events-service";
import type { CalendarEvent } from "@/services/events-service";
import * as UsersService from "@/services/users-service";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | undefined;
};

type NewEventDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent;
};

export default function NewEventDialog({
  isOpen,
  onClose,
  eventToEdit,
}: NewEventDialogProps) {
  const { toast } = useToast();
  const { notes } = useNotes();
  const { user } = useAuth();
  
  const isEditMode = !!eventToEdit;

  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [linkedNote, setLinkedNote] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState<Profile[]>([]);
  const [isCollaboratorPopoverOpen, setIsCollaboratorPopoverOpen] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  
  const fetchCollaboratorProfiles = useCallback(async (collaboratorIds: string[]) => {
    if (collaboratorIds && collaboratorIds.length > 0) {
      const profiles = await UsersService.getUserProfilesByIds(collaboratorIds);
      setCollaborators(profiles);
    }
  }, []);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDate(parseISO(eventToEdit.event_date));
      setTime(eventToEdit.event_time || "");
      setLinkedNote(eventToEdit.note_id || null);
      setDescription(eventToEdit.description || "");
      if (eventToEdit.collaborators) {
        fetchCollaboratorProfiles(eventToEdit.collaborators);
      }
    } else {
        resetForm();
    }
  }, [eventToEdit, fetchCollaboratorProfiles]);


  const resetForm = () => {
    setTitle("");
    setDate(new Date());
    setTime("");
    setLinkedNote(null);
    setDescription("");
    setCollaborators([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSearch = async () => {
    try {
      const results = await UsersService.searchUsersByEmail(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Could not perform user search.",
        variant: "destructive",
      });
    }
  };

  const addCollaborator = (user: Profile) => {
    if (!collaborators.some((c) => c.id === user.id)) {
      setCollaborators([...collaborators, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeCollaborator = (userId: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) {
      toast({
        title: "Error",
        description: "You must be logged in and select a date.",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
        user_id: user.id,
        title,
        description,
        event_date: format(date, "yyyy-MM-dd"),
        event_time: time || null,
        note_id: linkedNote,
        collaborators: collaborators.map((c) => c.id),
      };

    try {
      if (isEditMode) {
        await EventsService.updateEvent(eventToEdit.id, eventData);
        toast({ title: "Event Updated", description: "Your event has been successfully updated."});
      } else {
        await EventsService.addEvent(eventData);
        toast({ title: "Event Created", description: "Your new event has been added to the calendar." });
      }
      handleClose();
    } catch (error) {
      toast({
        title: isEditMode ? "Error Updating Event" : "Error Creating Event",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0">
        <Card className="bg-white">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">
              {isEditMode ? "Edit Event" : "Add New Event"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 p-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Finalize project report"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time (Optional)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Collaborators</Label>
                <div className="flex flex-wrap items-center gap-2 min-h-[40px] p-2 border rounded-md">
                  {collaborators.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 bg-gray-100 rounded-full pl-2 pr-1 py-0.5"
                    >
                      <span className="text-sm font-medium">{c.email}</span>
                      <button
                        type="button"
                        onClick={() => removeCollaborator(c.id)}
                        className="rounded-full hover:bg-gray-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <Popover
                    open={isCollaboratorPopoverOpen}
                    onOpenChange={setIsCollaboratorPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <p className="font-medium">Add people</p>
                        <Input
                          placeholder="Search by email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSearch();
                            }
                          }}
                        />
                        {searchResults.length > 0 && (
                          <div className="border rounded-md max-h-32 overflow-y-auto">
                            {searchResults.map((user) => (
                              <div
                                key={user.id}
                                onClick={() => addCollaborator(user)}
                                className="p-2 flex items-center gap-2 hover:bg-gray-100 cursor-pointer"
                              >
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback>
                                    {user.first_name?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{user.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link-note">Link to Note (Optional)</Label>
                <Select
                  value={linkedNote || "none"}
                  onValueChange={(value) =>
                    setLinkedNote(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger id="link-note">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {notes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a short description..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter className="p-6 pt-0">
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Save Changes" : "Save Event"}
              </Button>
            </DialogFooter>
          </form>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
