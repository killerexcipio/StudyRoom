
"use client";

import Link from "next/link";
import type { Note, Tag } from "@/lib/data";
import { CheckSquare, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import { useNotes } from "@/context/notes-context";

type ChecklistNoteCardProps = {
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

export default function ChecklistNoteCard({ note }: ChecklistNoteCardProps) {
  const { allTags } = useNotes();
  const tags = note.tags
    .map((tagId) => allTags.find((t) => t.id === tagId))
    .filter(Boolean) as Tag[];

  const completedItems = note.checklistItems?.filter((item) => item.checked).length || 0;
  const totalItems = note.checklistItems?.length || 0;
  const visibleItems = note.checklistItems?.slice(0, 3) || [];
  const hiddenItemsCount = totalItems - visibleItems.length;

  return (
    <Link href={`/note/${note.id}`}>
      <div
        className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-5 flex flex-col border border-gray-200/80 h-full"
        data-note-id={note.id}
      >
        <h3 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors mb-3">
          {note.title}
        </h3>
        <div className="text-sm text-gray-700 space-y-2 flex-1 mb-4">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-center">
              <input
                type="checkbox"
                defaultChecked={item.checked}
                className="mr-2.5 h-4 w-4 rounded text-indigo-500 pointer-events-none focus:ring-0"
                readOnly
              />
              <span className={item.checked ? 'line-through text-gray-400' : ''}>{item.text}</span>
            </div>
          ))}
           {hiddenItemsCount > 0 && (
            <div className="flex items-center text-gray-400 text-xs pl-1">
              <MoreHorizontal className="h-4 w-4 mr-1" />
              <span>{hiddenItemsCount} more item{hiddenItemsCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        <div className="mt-auto space-y-3 pt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-4 w-4" />
              <span>
                Edited {format(new Date(note.editedtime), "HH:mm, dd MMM yy")}
              </span>
            </div>
            <span className="font-medium">{completedItems}/{totalItems} done</span>
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
