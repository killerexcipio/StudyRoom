
"use client";

import NotesGrid from "@/components/notes/notes-grid";
import NotesHeader from "@/components/notes/notes-header";
import { useNotes } from "@/context/notes-context";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

export default function NotesView() {
  const { filteredNotes, loading, searchQuery, selectedTag, allTags } = useNotes();

  const getEmptyStateMessage = () => {
    const selectedTagName = selectedTag
      ? allTags.find((t) => t.id === selectedTag)?.label
      : "";

    if (searchQuery && selectedTag) {
      return `We couldn't find any notes matching "${searchQuery}" with the tag "${selectedTagName}".`;
    }
    if (searchQuery) {
      return `We couldn't find any notes matching "${searchQuery}".`;
    }
    if (selectedTag) {
      return `You don't have any notes with the tag "${selectedTagName}".`;
    }
    return "You haven't created any notes yet. Click 'New' to start.";
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <NotesHeader />
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        <NotesGrid notes={filteredNotes} />
      ) : (
        <div className="text-center py-16">
          <SearchX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No notes found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {getEmptyStateMessage()}
          </p>
        </div>
      )}
    </div>
  );
}
