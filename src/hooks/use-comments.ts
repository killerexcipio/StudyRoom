
"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { useToast } from "./use-toast";
import { useAuth } from "@/context/auth-context";

export type Comment = {
  id: string;
  created_at: string;
  user_id: string;
  content: string;
  note_id?: string;
  whiteboard_id?: string;
  user_email?: string;
  note_title?: string;
  whiteboard_title?: string;
};

type DocumentType = "note" | "whiteboard" | "recent";

export function useComments(
  documentType: DocumentType,
  documentId?: string
) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!user) {
      setComments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
        if (documentType === 'recent') {
            const { data, error } = await supabase
                .from('comments_with_users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            if (error) throw error;
            setComments(data || []);
        } else {
            const { data, error } = await supabase
                .from('comments_with_users')
                .select('*')
                .eq(`${documentType}_id`, documentId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setComments(data || []);
        }
    } catch (error) {
        toast({ title: "Error fetching comments", description: (error as Error).message, variant: 'destructive'});
        setComments([]);
    } finally {
        setLoading(false);
    }
  }, [documentId, documentType, supabase, toast, user]);

  useEffect(() => {
    fetchComments();

    if (documentType !== "recent" && documentId) {
      const channel = supabase
        .channel(`comments:${documentId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "comments",
            filter: `${documentType}_id=eq.${documentId}`,
          },
          () => fetchComments()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchComments, documentId, documentType, supabase]);

  const addComment = async (content: string, userId: string) => {
    const column = `${documentType}_id`;
    const { error } = await supabase
      .from("comments")
      .insert([{ content, user_id: userId, [column]: documentId }]);

    if (error) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return { comments, loading, addComment, deleteComment };
}
