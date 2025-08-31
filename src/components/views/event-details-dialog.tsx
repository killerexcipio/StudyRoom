
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
  } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ExternalLink, Calendar, Clock, FileText, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { CalendarEvent } from "@/services/events-service";

type EventDetailsDialogProps = {
    event: CalendarEvent;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (event: CalendarEvent) => void;
    onDelete: (eventId: string) => void;
};

export default function EventDetailsDialog({ event, isOpen, onClose, onEdit, onDelete }: EventDetailsDialogProps) {
    const router = useRouter();

    const handleViewNote = () => {
        if (event.note_id) {
            router.push(`/note/${event.note_id}`);
            onClose();
        }
    };
    
    // Time formatting
    const formatTime = (timeString: string) => {
        const [hour, minute] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hour), parseInt(minute));
        return format(date, 'h:mm a');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-3" />
                        <span className="text-sm">{format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    {event.event_time && (
                         <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-3" />
                            <span className="text-sm">{formatTime(event.event_time)}</span>
                        </div>
                    )}
                    {event.description && (
                        <div className="flex items-start text-gray-600">
                             <FileText className="h-4 w-4 mr-3 mt-1 flex-shrink-0" />
                             <p className="text-sm">{event.description}</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="justify-between">
                    <div>
                        {event.note_id && (
                            <Button variant="outline" size="sm" onClick={handleViewNote}>
                                <ExternalLink className="mr-2 h-4 w-4"/>
                                View Note
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                            <Edit className="mr-2 h-4 w-4"/>
                            Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4"/>
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the event &quot;{event.title}&quot;. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(event.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
