"use client";

import { useComments } from "@/hooks/use-comments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

type CommentSidebarProps = {
  documentType: "note" | "whiteboard";
  documentId: string;
};

export default function CommentSidebar({
  documentType,
  documentId,
}: CommentSidebarProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useComments(
    documentType,
    documentId
  );
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (newComment.trim() && user) {
      await addComment(newComment, user.id);
      setNewComment("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-gray-900 mb-4 px-6 pt-6">Comments</h3>
      <div className="flex-1 overflow-y-auto px-6 space-y-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No comments yet.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-3 group">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {comment.user_email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">
                    {comment.user_email}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                {comment.user_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteComment(comment.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-6 border-t mt-auto">
        <div className="relative">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="pr-12"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <Button
            size="icon"
            className="absolute right-2 top-2 h-8 w-8"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
