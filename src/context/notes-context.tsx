
"use client";

import type { Note, Tag } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./auth-context";
import * as NotesService from "@/services/notes-service";
import * as TagsService from "@/services/tags-service";

export type SortOption = "editedtime" | "created_at" | "title";

export type DbNote = Omit<Note, "id"> & { id: string };

interface NotesContextType {
  notes: Note[];
  filteredNotes: Note[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allTags: Tag[];
  loadingTags: boolean;
  selectedTag: Tag["id"] | null;
  setSelectedTag: (tagId: Tag["id"] | null) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  addNote: (
    note: Omit<Note, "id" | "editedtime" | "created_at" | "collaborators" | "is_public" | "user_id">
  ) => Promise<string | null>;
  updateNote: (note: Partial<Note> & { id: string }) => Promise<boolean>;
  deleteNote: (id: string) => Promise<void>;
  getNoteById: (id: string) => Note | undefined;
  addTag: (tag: Omit<Tag, "id" | "created_at">) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [selectedTag, setSelectedTag] = useState<Tag["id"] | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("editedtime");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTags = useCallback(async () => {
    if (!user) {
      setAllTags([]);
      setLoadingTags(false);
      return;
    }
    setLoadingTags(true);
    try {
      const tags = await TagsService.fetchTags();
      setAllTags(tags);
    } catch (error) {
      toast({ title: "Error fetching tags", description: (error as Error).message, variant: 'destructive' });
      setAllTags([]);
    } finally {
      setLoadingTags(false);
    }
  }, [user, toast]);

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetchedNotes = await NotesService.fetchNotes(user.id);
      setNotes(fetchedNotes);
    } catch (error) {
      toast({ title: "Error fetching notes", description: (error as Error).message, variant: "destructive" });
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const filteredNotes = useMemo(() => {
    let notesToFilter = [...notes];

    // Filter by search query
    if (searchQuery) {
      notesToFilter = notesToFilter.filter((note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      notesToFilter = notesToFilter.filter((note) =>
        note.tags.includes(selectedTag)
      );
    }

    // Sort the notes
    notesToFilter.sort((a, b) => {
      if (sortOption === "title") {
        return a.title.localeCompare(b.title);
      }
      const dateA = new Date(a[sortOption] || 0).getTime();
      const dateB = new Date(b[sortOption] || 0).getTime();
      return dateB - dateA;
    });

    return notesToFilter;
  }, [notes, searchQuery, selectedTag, sortOption]);

  const addNote = async (
    note: Omit<Note, "id" | "editedtime" | "created_at" | "collaborators" | "is_public" | "user_id">
  ): Promise<string | null> => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a note.", variant: "destructive" });
      return null;
    }
    try {
      const newNoteId = await NotesService.addNote(note, user.id);
      toast({ title: "Note Created", description: `A new note has been successfully created.` });
      await fetchNotes();
      return newNoteId;
    } catch (error) {
      toast({ title: "Error creating note", description: (error as Error).message, variant: "destructive" });
      return null;
    }
  };

  const updateNote = async (updatedNote: Partial<Note> & { id: string }) => {
    try {
      await NotesService.updateNote(updatedNote);
      await fetchNotes();
      return true;
    } catch (error) {
      toast({ title: "Error updating note", description: (error as Error).message, variant: "destructive" });
      return false;
    }
  };

  const deleteNote = async (id: string) => {
    const noteToDelete = notes.find((note) => note.id === id);
    if (!noteToDelete) return;
    try {
      await NotesService.deleteNote(id);
      toast({ title: "Note Deleted", description: `"${noteToDelete.title}" has been moved to the trash.` });
      await fetchNotes();
    } catch (error) {
      toast({ title: "Error deleting note", description: (error as Error).message, variant: "destructive" });
    }
  };

  const addTag = async (tag: Omit<Tag, 'id' | 'created_at'>) => {
    try {
      await TagsService.addTag(tag);
      toast({ title: "Tag created!" });
      fetchTags();
    } catch (error) {
      toast({ title: "Error creating tag", description: (error as Error).message, variant: "destructive" });
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await TagsService.deleteTag(id);
      toast({ title: "Tag deleted" });
      fetchTags();
      fetchNotes();
    } catch (error) {
      toast({ title: "Error deleting tag", description: (error as Error).message, variant: "destructive" });
    }
  };


  const getNoteById = (id: string) => {
    return notes.find((note) => note.id === id);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        filteredNotes,
        loading,
        searchQuery,
        setSearchQuery,
        allTags,
        loadingTags,
        selectedTag,
        setSelectedTag,
        sortOption,
        setSortOption,
        addNote,
        updateNote,
        deleteNote,
        getNoteById,
        addTag,
        deleteTag,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider");
  }
  return context;
}
