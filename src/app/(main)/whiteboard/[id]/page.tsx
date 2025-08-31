"use client";

import WhiteboardEditorView from "@/components/views/whiteboard-editor-view";
import CommentSidebar from "@/components/layout/comment-sidebar";
import { useSidebar } from "@/hooks/use-sidebar.tsx";
import { useEffect, use } from "react";

export default function WhiteboardPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const { setSidebarContent } = useSidebar();

  useEffect(() => {
    setSidebarContent(
      <CommentSidebar documentType="whiteboard" documentId={id} />
    );
    return () => setSidebarContent(null);
  }, [id, setSidebarContent]);

  return <WhiteboardEditorView whiteboardId={id} />;
}
