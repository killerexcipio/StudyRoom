
"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, User } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { Note } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';
import { useNotes } from '@/context/notes-context';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import * as NotesService from '@/services/notes-service';

type PublicNote = Pick<Note, 'id' | 'title' | 'content' | 'type'> & { user_email: string };

export default function PublicLibraryView() {
    const [publicNotes, setPublicNotes] = useState<PublicNote[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { addNote } = useNotes();
    const router = useRouter();
    const { user } = useAuth();
    
    useEffect(() => {
        const fetchPublicNotes = async () => {
            setLoading(true);
            try {
                const data = await NotesService.getPublicNotes();
                setPublicNotes(data || []);
            } catch (error) {
                toast({
                    title: "Error fetching public notes",
                    description: (error as Error).message,
                    variant: "destructive",
                });
            }
            setLoading(false);
        };

        fetchPublicNotes();
    }, [toast]);
    
    const handleCopyToWorkspace = async (note: PublicNote) => {
        if (!user) {
            toast({
              title: "Authentication Error",
              description: "You must be logged in to copy a note.",
              variant: "destructive",
            });
            return;
        }

        const newNoteId = await addNote({
            title: `Copy of: ${note.title}`,
            content: note.content,
            tags: [],
            type: note.type,
        });

        if (newNoteId) {
            toast({
                title: "Note Copied!",
                description: `"${note.title}" has been copied to your notes.`,
            });
            router.push(`/note/${newNoteId}`);
        }
    };


    return (
        <div className="flex-1 p-4 md:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Public Library</h1>
                <p className="text-gray-600 mt-1">Discover notes and ideas shared by the community.</p>
            </header>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            ) : publicNotes.length === 0 ? (
                <div className="text-center py-16">
                    <h3 className="text-lg font-medium text-gray-900">Nothing here yet!</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No notes have been made public. Be the first to share!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {publicNotes.map(note => (
                        <Card key={note.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="truncate">{note.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-gray-600 line-clamp-3">
                                    {note.content ? new DOMParser().parseFromString(note.content, "text/html").body.textContent : 'No content'}
                                </p>
                            </CardContent>
                            <CardFooter className="flex items-center justify-between mt-auto pt-4 border-t">
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <User className="h-4 w-4 text-gray-500" />
                                    </div>
                                    <span className="text-xs text-gray-500 truncate" title={note.user_email}>{note.user_email}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 flex-shrink-0" onClick={() => handleCopyToWorkspace(note)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
