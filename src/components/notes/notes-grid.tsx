import type { Note } from "@/lib/data";
import NoteCard from "./note-card";
import ChecklistNoteCard from "./checklist-note-card";
import ImageNoteCard from "./image-note-card";

type NotesGridProps = {
  notes: Note[];
};

export default function NotesGrid({ notes }: NotesGridProps) {
  return (
    <div
      id="notes-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {notes.map((note) => {
        if (note.type === "checklist") {
          return <ChecklistNoteCard key={note.id} note={note} />;
        }
        if (note.type === "image") {
          return <ImageNoteCard key={note.id} note={note} />;
        }
        return <NoteCard key={note.id} note={note} />;
      })}
    </div>
  );
}
