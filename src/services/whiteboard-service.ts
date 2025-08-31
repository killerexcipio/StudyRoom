
import { getSupabase } from "@/lib/supabase";
import type { Shape } from "@/hooks/use-whiteboard";
import type { Whiteboard } from "@/lib/data";

const supabase = getSupabase();

export const fetchWhiteboardContent = async (whiteboardId: string) => {
  const { data, error } = await supabase
    .from("whiteboards")
    .select("content")
    .eq("id", whiteboardId)
    .single();

  if (error) {
    console.error("Failed to fetch whiteboard content", error);
    throw error;
  }
  return data?.content?.shapes || [];
};

export const saveWhiteboardContent = async (
  whiteboardId: string,
  shapes: Shape[]
) => {
  const { error } = await supabase
    .from("whiteboards")
    .update({
      content: { shapes: shapes.map((s) => ({ ...s, isEditing: undefined })) },
    })
    .eq("id", whiteboardId);

  if (error) {
    console.error("Failed to save whiteboard content:", error);
  }
  return !error;
};

export const createWhiteboard = async (userId: string) => {
  const { data, error } = await supabase
    .from("whiteboards")
    .insert({ user_id: userId, title: "Untitled Whiteboard" })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating whiteboard", error);
    throw error;
  }
  return data;
};

export const deleteWhiteboard = async (whiteboardId: string) => {
  const { error } = await supabase
    .from("whiteboards")
    .delete()
    .eq("id", whiteboardId);
  if (error) {
    console.error("Error deleting whiteboard:", error);
    throw error;
  }
};

export const fetchWhiteboards = async () => {
  const { data, error } = await supabase
    .from("whiteboards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching whiteboards", error);
    throw error;
  }
  return data || [];
};

export const fetchWhiteboardDetails = async (whiteboardId: string) => {
  const { data, error } = await supabase
    .from("whiteboards")
    .select("*")
    .eq("id", whiteboardId)
    .single();

  if (error) {
    console.error("Error fetching whiteboard details", error);
    throw error;
  }
  return data;
};

export const updateWhiteboardTitle = async (
  whiteboardId: string,
  title: string
) => {
  const { error } = await supabase
    .from("whiteboards")
    .update({ title: title })
    .eq("id", whiteboardId);

  if (error) {
    console.error("Error updating whiteboard title", error);
    throw error;
  }
};

export const getCollaborators = async (whiteboardId: string) => {
  const { data, error } = await supabase
    .from("whiteboards")
    .select("collaborators")
    .eq("id", whiteboardId)
    .single();

  if (error) {
    console.error("Error fetching collaborators", error);
    throw error;
  }
  return data?.collaborators || [];
};

export const updateCollaborators = async (
  whiteboardId: string,
  collaboratorIds: string[]
) => {
  const { error } = await supabase
    .from("whiteboards")
    .update({ collaborators: collaboratorIds })
    .eq("id", whiteboardId);

  if (error) {
    console.error("Error updating collaborators", error);
    throw error;
  }
};
