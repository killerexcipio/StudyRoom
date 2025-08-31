
import { getSupabase } from "@/lib/supabase";
import type { Note } from "@/lib/data";

const supabase = getSupabase();

export const fetchNotes = async (
  userId: string,
) => {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .or(`user_id.eq.${userId},collaborators.cs.{${userId}}`)
    .order("editedtime", { ascending: false });
    
  if (error) {
    console.error("Error fetching notes:", error);
    throw error;
  }
  return (data || []).map(fromDbToNote);
};

export const addNote = async (
  note: Omit<Note, "id" | "editedtime" | "created_at" | "collaborators" | "is_public" | "user_id">,
  userId: string
) => {
  const { data, error } = await supabase
    .from("notes")
    .insert([
      {
        ...note,
        editedtime: new Date().toISOString(),
        created_at: new Date().toISOString(),
        user_id: userId,
        collaborators: [],
        is_public: false,
        tags: note.tags || [],
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("Error creating note:", error);
    throw error;
  }
  return data.id;
};

export const updateNote = async (
  updatedNote: Partial<Note> & { id: string }
) => {
  const { id, ...updates } = updatedNote;
  const { error } = await supabase
    .from("notes")
    .update({ ...updates, editedtime: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error updating note:", error);
    throw error;
  }
  return true;
};

export const deleteNote = async (id: string) => {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) {
    console.error("Error deleting note:", error);
    throw error;
  }
};

export const getPublicNotes = async () => {
    const { data, error } = await supabase.rpc('get_public_notes');
    if (error) {
        console.error("Error fetching public notes:", error);
        throw error;
    }
    return data;
}

export const getCollaborators = async (noteId: string) => {
    const { data, error } = await supabase
        .from('notes')
        .select('collaborators')
        .eq('id', noteId)
        .single();
    
    if (error) {
        console.error("Error fetching collaborators", error);
        throw error;
    }
    return data?.collaborators || [];
}

export const updateCollaborators = async (noteId: string, collaboratorIds: string[]) => {
    const { error } = await supabase
        .from('notes')
        .update({ collaborators: collaboratorIds })
        .eq('id', noteId);
    
    if (error) {
        console.error("Error updating collaborators", error);
        throw error;
    }
}


const fromDbToNote = (dbNote: any): Note => ({
  ...dbNote,
  id: dbNote.id,
  editedtime: new Date(dbNote.editedtime).toISOString(),
  created_at: new Date(dbNote.created_at).toISOString(),
  tags: dbNote.tags || [],
  collaborators: dbNote.collaborators || [],
  checklistItems: dbNote.checklistItems || [],
  is_public: dbNote.is_public || false,
});
    
