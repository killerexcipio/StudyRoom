import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Heading1,
    Heading2,
    List,
    ListOrdered,
  } from "lucide-react";
  import { Button } from "../ui/button";
  import { Separator } from "../ui/separator";
  
  export default function NoteEditorToolbar() {
    const applyFormat = (command: string, value?: string) => {
      document.execCommand(command, false, value);
    };
  
    return (
      <div className="flex items-center space-x-1 p-2 border-b bg-gray-50 rounded-t-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("underline")}
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("strikeThrough")}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("formatBlock", "h1")}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("formatBlock", "h2")}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-2" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("insertUnorderedList")}
          title="Bulleted List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => applyFormat("insertOrderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
    );
  }
