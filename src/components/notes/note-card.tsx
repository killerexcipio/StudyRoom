
import Link from "next/link";
import type { Note, Tag } from "@/lib/data";
import { FileText } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useNotes } from "@/context/notes-context";
import * as UsersService from "@/services/users-service";

type NoteCardProps = {
  note: Note;
};

type Profile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | undefined;
};

const tagColorClasses = {
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  rose: "bg-rose-100 text-rose-800 border-rose-200",
  sky: "bg-sky-100 text-sky-800 border-sky-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  slate: "bg-slate-100 text-slate-800 border-slate-200",
  violet: "bg-violet-100 text-violet-800 border-violet-200",
};

export default function NoteCard({ note }: NoteCardProps) {
  const [collaboratorProfiles, setCollaboratorProfiles] = useState<Profile[]>([]);
  const { allTags } = useNotes();

  const fetchCollaboratorProfiles = useCallback(async (collaboratorIds: string[]) => {
    if (collaboratorIds && collaboratorIds.length > 0) {
      const profiles = await UsersService.getUserProfilesByIds(collaboratorIds);
      setCollaboratorProfiles(profiles);
    } else {
        setCollaboratorProfiles([]);
    }
  }, []);

  useEffect(() => {
    fetchCollaboratorProfiles(note.collaborators);
  }, [note.collaborators, fetchCollaboratorProfiles]);

  const tags = note.tags
    .map((tagId) => allTags.find((t) => t.id === tagId))
    .filter(Boolean) as Tag[];

  // Helper function to strip HTML for plaintext preview
  const stripHtml = (html: string) => {
    if (typeof document !== "undefined") {
      const doc = new DOMParser().parseFromString(html, "text/html");
      return doc.body.textContent || "";
    }
    // Fallback for server-side rendering
    return html.replace(/<[^>]*>?/gm, "");
  };

  const plainTextContent = note.content ? stripHtml(note.content) : "";

  return (
    <Link href={`/note/${note.id}`}>
      <div
        className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-5 flex flex-col border border-gray-200/80 h-full"
        data-note-id={note.id}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">
            {note.title}
          </h3>
          {collaboratorProfiles.length > 0 && (
            <div className="flex -space-x-2 flex-shrink-0 ml-4">
              {collaboratorProfiles.map((collaborator) => (
                 <Avatar key={collaborator!.id} className="h-7 w-7 border-2 border-white">
                    <AvatarFallback>
                        {collaborator.first_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                 </Avatar>
              ))}
            </div>
          )}
        </div>

        {note.content && (
          <p className="text-sm text-gray-600 flex-1 line-clamp-3 mb-4">
            {plainTextContent}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-3">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <FileText className="h-4 w-4" />
            <span>
              Edited {format(new Date(note.editedtime), "HH:mm, dd MMM yy")}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag!.id}
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                    tagColorClasses[tag!.color]
                  }`}
                  variant="outline"
                >
                  {tag!.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
