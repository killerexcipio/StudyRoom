
import { getSupabase } from "@/lib/supabase";
import type { Tag } from "@/lib/data";

const supabase = getSupabase();

export const fetchTags = async () => {
  const { data, error } = await supabase.from("tags").select("*");
  if (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
  return data || [];
};

export const addTag = async (tag: Omit<Tag, "id" | "created_at">) => {
  const { error } = await supabase.from("tags").insert(tag);
  if (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
};

export const deleteTag = async (tagId: string) => {
  // First, remove the tag from all notes that use it
  const { data: notesWithTag, error: fetchError } = await supabase
    .from("notes")
    .select("id, tags")
    .contains("tags", [tagId]);

  if (fetchError) {
    console.error("Error finding notes with tag:", fetchError);
    throw fetchError;
  }

  for (const note of notesWithTag) {
    const updatedTags = note.tags.filter((t) => t !== tagId);
    const { error: updateError } = await supabase
      .from("notes")
      .update({ tags: updatedTags })
      .eq("id", note.id);
    if (updateError) {
      console.error("Error updating note tags:", updateError);
      throw updateError;
    }
  }

  // Then, delete the tag itself
  const { error } = await supabase.from("tags").delete().eq("id", tagId);
  if (error) {
    console.error("Error deleting tag:", error);
    throw error;
  }
};
    