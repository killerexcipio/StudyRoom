
"use client";

import { useNotes } from "@/context/notes-context";
import type { TagColor } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "../ui/input";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";

const tagColorClasses: Record<TagColor, string> = {
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  slate: "bg-slate-500",
  violet: "bg-violet-500",
};
const colorOptions: TagColor[] = ["sky", "amber", "emerald", "rose", "slate", "violet"];


function NewTagPopover() {
  const { addTag } = useNotes();
  const { user } = useAuth();
  const { toast } = useToast();
  const [label, setLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState<TagColor>("sky");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTag = async () => {
    if (!label.trim() || !user) {
      toast({ title: "Tag label cannot be empty.", variant: "destructive" });
      return;
    }
    await addTag({
      label: label.trim(),
      color: selectedColor,
      user_id: user.id,
    });
    setLabel("");
    setSelectedColor("sky");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start mt-2">
          <Plus className="mr-2 h-4 w-4" />
          New Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <h4 className="font-medium">Create New Tag</h4>
          <Input
            placeholder="Tag name..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <div className="flex items-center justify-between">
            {colorOptions.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-6 h-6 rounded-full transition-transform",
                  tagColorClasses[color],
                  selectedColor === color && "ring-2 ring-offset-2 ring-indigo-500"
                )}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
          <Button onClick={handleAddTag} className="w-full">
            Add Tag
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Tags() {
  const { allTags, selectedTag, setSelectedTag, loadingTags, deleteTag } = useNotes();
  const { user } = useAuth();

  const handleTagClick = (tagId: string) => {
    setSelectedTag(selectedTag === tagId ? null : tagId);
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center px-3 mb-2">
        <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
          Tags
        </h3>
      </div>
      {loadingTags ? (
         <div className="px-3 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
         </div>
      ) : (
        <ul className="space-y-1">
          {allTags.map((tag) => (
            <li key={tag.id} className="group flex items-center pr-2">
              <button
                onClick={() => handleTagClick(tag.id)}
                className={cn(
                  "flex items-center space-x-3 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 w-full text-left rounded-lg",
                  selectedTag === tag.id
                    ? "bg-indigo-100 text-indigo-700 font-semibold"
                    : "hover:bg-gray-100"
                )}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    tagColorClasses[tag.color as TagColor]
                  }`}
                ></span>
                <span className="flex-1 truncate">{tag.label}</span>
              </button>
              {tag.user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => deleteTag(tag.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <NewTagPopover />
    </div>
  );
}
