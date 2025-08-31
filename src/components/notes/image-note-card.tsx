
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Note, Tag } from "@/lib/data";
import { ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { useNotes } from "@/context/notes-context";

type ImageNoteCardProps = {
  note: Note;
};

const tagColorClasses: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  rose: "bg-rose-100 text-rose-800 border-rose-200",
  sky: "bg-sky-100 text-sky-800 border-sky-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  slate: "bg-slate-100 text-slate-800 border-slate-200",
  violet: "bg-violet-100 text-violet-800 border-violet-200",
};

export default function ImageNoteCard({ note }: ImageNoteCardProps) {
  const { allTags } = useNotes();
  const tags = note.tags
    .map((tagId) => allTags.find((t) => t.id === tagId))
    .filter(Boolean) as Tag[];

  return (
    <Link href={`/note/${note.id}`}>
      <div
        className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col border border-gray-200/80 overflow-hidden h-full"
        data-note-id={note.id}
      >
        {note.imageUrl && (
          <div className="relative w-full h-40 overflow-hidden">
            <Image
              src={note.imageUrl}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              alt={note.imageAlt || "Note image"}
              data-ai-hint="abstract design"
            />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors mb-2">
            {note.title}
          </h3>
          <p className="text-sm text-gray-600 flex-1 line-clamp-2 mb-4">
            {note.content}
          </p>
          <div className="mt-auto space-y-3 pt-3">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <ImageIcon className="h-4 w-4" />
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
      </div>
    </Link>
  );
}
