
"use client";

import { useNotes } from "@/context/notes-context";
import {
  ArrowLeft,
  MoreVertical,
  Share2,
  Trash2,
  Undo2,
  Save,
  Tag,
  Globe,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo, useCallback, useRef, use } from "react";
import type { Note, Tag as TagType, TagColor } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import NoteEditorToolbar from "../notes/note-editor-toolbar";
import { Card } from "../ui/card";
import ShareDialog from "./share-dialog";
import { useAuth } from "@/context/auth-context";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

type SaveStatus = "idle" | "saving" | "saved";

export default function NoteEditorView({ noteId }: { noteId: string }) {
  const { getNoteById, updateNote, deleteNote, loading, allTags } = useNotes();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabase();

  const note = useMemo(() => getNoteById(noteId), [noteId, getNoteById]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setContent(newContent);
    setIsDirty(true);
    setSaveStatus("idle");

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'content-update',
        payload: { content: newContent },
      });
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setIsDirty(true);
    setSaveStatus("idle");
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'title-update',
        payload: { title: newTitle },
      });
    }
  };

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || "");
      setTags(note.tags || []);
      setIsPublic(note.is_public || false);
      if (editorRef.current) {
        editorRef.current.innerHTML = note.content || "";
      }
      setIsDirty(false);
      setSaveStatus("idle");
    }
  }, [note]);

  useEffect(() => {
    if (!note || !user) return;
  
    const channel = supabase.channel(`note:${note.id}`);
    channelRef.current = channel;
  
    channel
      .on('broadcast', { event: 'content-update' }, ({ payload }) => {
        if (editorRef.current && editorRef.current.innerHTML !== payload.content) {
          const selection = window.getSelection();
          const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const startOffset = range?.startOffset;

          editorRef.current.innerHTML = payload.content;

           if (range && startOffset !== undefined && editorRef.current.firstChild) {
            try {
              const newRange = document.createRange();
              const textNode = editorRef.current.firstChild;
              if(textNode && textNode.textContent && startOffset <= textNode.textContent.length) {
                newRange.setStart(textNode, startOffset);
                newRange.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(newRange);
              }
            } catch (e) {
                console.error("Could not restore cursor position", e)
            }
          }
        }
      })
      .on('broadcast', { event: 'title-update' }, ({ payload }) => {
        setTitle(payload.title);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to real-time channel for note:', note.id);
        }
      });
  
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [note, user, supabase]);


  const handleTagChange = (tagId: string) => {
    setTags((prevTags) => {
      const newTags = prevTags.includes(tagId)
        ? prevTags.filter((id) => id !== tagId)
        : [...prevTags, tagId];
      setIsDirty(true);
      setSaveStatus("idle");
      return newTags;
    });
  };

  const handleSave = useCallback(async () => {
    if (!note || !isDirty) {
      return;
    }

    setSaveStatus("saving");
    const updatedNoteData: Partial<Note> & { id: string } = {
      id: note.id,
      title,
      content,
      tags,
      is_public: isPublic,
    };

    const success = await updateNote(updatedNoteData);

    if (success) {
      setIsDirty(false);
      setSaveStatus("saved");
      toast({ title: "Note saved" });

      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } else {
      setSaveStatus("idle");
      toast({ title: "Error saving note", variant: "destructive" });
    }
  }, [note, isDirty, title, content, tags, isPublic, updateNote, toast]);

  const handleBack = async () => {
    if (isDirty) {
      await handleSave();
    }
    router.push("/");
  };
  
  const handleTitleBlur = () => {
    if (isDirty) {
      handleSave();
    }
  };

  const togglePublic = async () => {
    if (!note) return;

    const newPublicStatus = !isPublic;
    setIsPublic(newPublicStatus);

    const success = await updateNote({ id: note.id, is_public: newPublicStatus });
    if (success) {
        toast({
            title: newPublicStatus ? "Note is now public" : "Note is now private",
        });
    } else {
        setIsPublic(!newPublicStatus);
        toast({
            title: "Error updating note",
            variant: "destructive",
        });
    }
};

  if (loading && !note) {
    return (
      <div className="flex-1 p-4 md:p-8 flex flex-col space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex-1 p-8 text-center">
        Note not found. It might have been deleted.{" "}
        <Link href="/" className="text-indigo-600 underline">
          Go back to notes
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleteDialogOpen(false);
    await deleteNote(note.id);
    router.push("/");
  };

  const getSaveIconColor = () => {
    if (saveStatus === "saved") {
      return "text-green-500";
    }
    return "text-gray-500";
  };

  const selectedNoteTags = allTags.filter((tag) => tags.includes(tag.id));
  const tagColorClasses: Record<string, string> = {
    sky: "bg-sky-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    slate: "bg-slate-500",
    violet: "bg-violet-500",
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col min-h-0">
      <Card className="mb-4 p-4">
        <header className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center flex-1 min-w-0">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="icon"
              className="mr-2 flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <input
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              className="text-2xl md:text-3xl font-bold text-gray-900 bg-transparent focus:outline-none focus:bg-gray-100 rounded-md px-2 py-1 w-full"
              placeholder="Untitled Note"
            />
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {isDirty && (
              <Button
                onClick={handleSave}
                variant="ghost"
                size="icon"
                disabled={saveStatus === "saving"}
              >
                <Save className={getSaveIconColor()} />
              </Button>
            )}
            
            <div className="flex items-center space-x-1">
              {selectedNoteTags.length > 0 && (
                <div className="flex items-center space-x-1 mr-1">
                  {selectedNoteTags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`w-2.5 h-2.5 rounded-full ${
                        tagColorClasses[tag.color as TagColor]
                      }`}
                      title={tag.label}
                    ></span>
                  ))}
                </div>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Tag className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                  <div className="grid gap-4">
                    <h4 className="font-medium leading-none">Tags</h4>
                    <div className="grid gap-2">
                      {allTags.map((tag: TagType) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={tag.id}
                            checked={tags.includes(tag.id)}
                            onCheckedChange={() => handleTagChange(tag.id)}
                          />
                          <Label
                            htmlFor={tag.id}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${tagColorClasses[tag.color as TagColor]}`}
                            ></span>
                            <span>{tag.label}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" onClick={() => setIsShareDialogOpen(true)}>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Undo2 className="mr-2 h-4 w-4" />
                    <span>Version History</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={togglePublic}>
                    {isPublic ? (
                      <><Lock className="mr-2 h-4 w-4" /><span>Make Private</span></>
                    ) : (
                      <><Globe className="mr-2 h-4 w-4" /><span>Make Public</span></>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your note.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
      </Card>
      
      {note && (
        <ShareDialog
          documentId={note.id}
          documentType="note"
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col border rounded-lg bg-white shadow-sm overflow-hidden min-h-0">
        <NoteEditorToolbar />
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          className="flex-1 p-4 md:p-6 text-base focus:outline-none prose max-w-none overflow-y-auto"
        />
      </div>
    </div>
  );
}
