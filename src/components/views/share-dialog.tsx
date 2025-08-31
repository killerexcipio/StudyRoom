
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import * as UsersService from "@/services/users-service";
import * as NotesService from "@/services/notes-service";
import * as WhiteboardService from "@/services/whiteboard-service";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | undefined;
};

type ShareDialogProps = {
  documentId: string;
  documentType: "note" | "whiteboard";
  isOpen: boolean;
  onClose: () => void;
};

export default function ShareDialog({
  documentId,
  documentType,
  isOpen,
  onClose,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const DocumentService =
    documentType === "note" ? NotesService : WhiteboardService;

  useEffect(() => {
    if (isOpen) {
      const loadInitialData = async () => {
        setIsLoading(true);
        try {
          const collaboratorIds = await DocumentService.getCollaborators(documentId);
          if (collaboratorIds.length > 0) {
            const profiles = await UsersService.getUserProfilesByIds(collaboratorIds);
            setCollaborators(profiles);
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Could not load document data.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      loadInitialData();
    } else {
      setCollaborators([]);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, documentId, DocumentService, toast]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await UsersService.searchUsersByEmail(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Could not perform user search.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addCollaborator = (user: Profile) => {
    if (!collaborators.some((c) => c.id === user.id)) {
      setCollaborators([...collaborators, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeCollaborator = (userId: string) => {
    setCollaborators(collaborators.filter((c) => c.id !== userId));
  };

  const handleSave = async () => {
    const collaboratorIds = collaborators.map((c) => c.id);
    setIsLoading(true);
    try {
      await DocumentService.updateCollaborators(documentId, collaboratorIds);
      toast({ title: "Collaborators updated!" });
      onClose();
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update collaborators.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Share {documentType}</DialogTitle>
          <DialogDescription>
            Invite others to view and collaborate.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Input
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={isLoading}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleSearch}
              disabled={isSearching || isLoading}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => addCollaborator(user)}
                  className="p-2 flex items-center space-x-3 hover:bg-accent cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.first_name?.charAt(0)}
                      {user.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <h4 className="font-medium text-sm mb-2">People with access</h4>
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {collaborators.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 bg-secondary rounded-md"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.first_name?.charAt(0)}
                          {user.last_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => removeCollaborator(user.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {collaborators.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Only you have access.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
