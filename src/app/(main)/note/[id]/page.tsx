"use client";

import NoteEditorView from "@/components/views/note-editor-view";
import CommentSidebar from "@/components/layout/comment-sidebar";
import { useSidebar } from "@/hooks/use-sidebar.tsx";
import { useEffect, use } from "react";

export default function NoteEditorPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const { setSidebarContent } = useSidebar();

  useEffect(() => {
    setSidebarContent(
      <CommentSidebar documentType="note" documentId={id} />
    );
    return () => setSidebarContent(null);
  }, [id, setSidebarContent]);

  return <NoteEditorView noteId={id} />;
}
