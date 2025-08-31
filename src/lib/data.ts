
export type TagColor = "amber" | "rose" | "sky" | "emerald" | "slate" | "violet";

export type Tag = {
  id: string;
  created_at: string;
  user_id: string | null; // null for default tags
  label: string;
  color: string; // Keep as string for flexibility from DB
};

export type Avatar = {
  id: string;
  src: string;
  alt: string;
};

export type Note = {
  id: string;
  title: string;
  content?: string;
  editedtime: string;
  created_at: string;
  tags: string[];
  collaborators: string[]; // Array of user UUIDs
  type: "text" | "checklist" | "image";
  checklistItems?: { id: string; text: string; checked: boolean }[];
  imageUrl?: string;
  imageAlt?: string;
  is_public: boolean;
  user_id: string;
};

export type Whiteboard = {
    id: string;
    created_at: string;
    user_id: string;
    title: string;
    content: any; //jsonb
    collaborators: string[];
}
