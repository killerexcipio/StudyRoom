"use client";

import { Filter } from "lucide-react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotes, type SortOption } from "@/context/notes-context";

export default function NotesHeader() {
  const { sortOption, setSortOption } = useNotes();

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between mb-6">
      <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
      <div className="flex items-center space-x-4 mt-4 md:mt-0">
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">Sort by:</span>
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editedtime">Last Modified</SelectItem>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>
    </header>
  );
}
