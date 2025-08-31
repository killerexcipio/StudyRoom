
"use client";

import { ArrowLeft, MoreVertical, Save, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWhiteboard } from "@/hooks/use-whiteboard";
import { Toolbar } from "../whiteboard/toolbar";
import { Canvas } from "../whiteboard/canvas";
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Whiteboard } from "@/lib/data";
import ShareDialog from "./share-dialog";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "../ui/skeleton";
import * as WhiteboardService from "@/services/whiteboard-service";
import { getSupabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SaveStatus = "idle" | "saving" | "saved";

export default function WhiteboardEditorView({
  whiteboardId,
}: {
  whiteboardId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [whiteboardData, setWhiteboardData] = useState<Whiteboard | null>(null);
  const [title, setTitle] = useState("");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabase();

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const {
    shapes,
    selectedShapeIds,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
    onShapePointerDown,
    onShapeChange,
    onShapeDoubleClick,
    deleteSelectedShapes,
    undo,
    redo,
    cursors,
  } = useWhiteboard(whiteboardId);

  const fetchWhiteboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await WhiteboardService.fetchWhiteboardDetails(whiteboardId);
      setWhiteboardData(data);
      setTitle(data.title);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch whiteboard data.",
        variant: "destructive",
      });
      router.push("/whiteboards");
    } finally {
      setIsLoading(false);
    }
  }, [whiteboardId, toast, router]);

  useEffect(() => {
    fetchWhiteboard();
  }, [fetchWhiteboard]);

  useEffect(() => {
    if (!user || !whiteboardId) return;

    const channel = supabase.channel(`whiteboard:${whiteboardId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "title-update" }, ({ payload }) => {
        setTitle(payload.title);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [whiteboardId, user, supabase]);

  const handleTitleChange = async (newTitle: string) => {
    if (newTitle === whiteboardData?.title || !whiteboardData) {
      return;
    }

    setSaveStatus("saving");
    const originalTitle = whiteboardData.title;
    setWhiteboardData((prev) => ({ ...prev!, title: newTitle }));

    try {
      await WhiteboardService.updateWhiteboardTitle(whiteboardId, newTitle);
      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "title-update",
          payload: { title: newTitle },
        });
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      toast({ title: "Error saving title", variant: "destructive" });
      setWhiteboardData((prev) => ({ ...prev!, title: originalTitle }));
      setSaveStatus("idle");
    }
  };

  const handleDelete = async () => {
    setIsDeleteDialogOpen(false);
    try {
      await WhiteboardService.deleteWhiteboard(whiteboardId);
      toast({ title: "Whiteboard deleted." });
      router.push("/whiteboards");
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete whiteboard.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    router.push("/whiteboards");
  };

  const getSaveIconColor = () => {
    if (saveStatus === "saved") {
      return "text-green-500";
    }
    if (saveStatus === "saving") {
      return "text-amber-500 animate-spin";
    }
    return "text-gray-400";
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        <header className="p-2 pr-4 border-b flex items-center justify-between bg-white z-10">
          <div className="flex items-center flex-1 min-w-0">
            <Skeleton className="h-10 w-10 mr-2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
          </div>
        </header>
        <div className="flex-1 relative overflow-hidden">
          <Skeleton className="absolute top-4 left-4 h-64 w-14" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      <header className="p-2 pr-4 border-b flex items-center justify-between bg-white z-10">
        <div className="flex items-center flex-1 min-w-0">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="mr-2 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => handleTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="text-lg font-semibold bg-transparent focus:outline-none focus:bg-gray-100 rounded-md px-2 py-1 w-full min-w-0"
              placeholder="Untitled Whiteboard"
            />
            <Save
              className={`h-5 w-5 transition-colors ${getSaveIconColor()}`}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedShapeIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedShapes}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShareDialogOpen(true)}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onSelect={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Whiteboard</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this whiteboard and all of its
                  contents. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>
      <div className="flex-1 relative overflow-hidden">
        <Toolbar undo={undo} redo={redo} />
        <Canvas
          shapes={shapes}
          selectedShapeIds={selectedShapeIds}
          cursors={cursors}
          onCanvasPointerDown={onCanvasPointerDown}
          onCanvasPointerMove={onCanvasPointerMove}
          onCanvasPointerUp={onCanvasPointerUp}
          onShapePointerDown={onShapePointerDown}
          onShapeChange={onShapeChange}
          onShapeDoubleClick={onShapeDoubleClick}
        />
      </div>
      {whiteboardData && (
        <ShareDialog
          documentId={whiteboardId}
          documentType="whiteboard"
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
        />
      )}
    </div>
  );
}
