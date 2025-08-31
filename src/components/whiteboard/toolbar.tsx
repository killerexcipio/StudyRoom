"use client";

import { Hand, Square, Undo, Redo, Pen, Eraser, StickyNote, Type, MousePointer2 } from "lucide-react";
import { useWhiteboardState } from "@/hooks/use-whiteboard";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

type ToolbarProps = {
    undo: () => void;
    redo: () => void;
}

const COLORS = ["#DC2626", "#D97706", "#65A30D", "#059669", "#0891B2", "#4F46E5", "#C026D3"];

export function Toolbar({ undo, redo }: ToolbarProps) {
  const { tool, setTool, color, setColor } = useWhiteboardState();

  const tools = [
    { name: "select", icon: MousePointer2 },
    { name: "pen", icon: Pen },
    { name: "eraser", icon: Eraser },
    { name: "rectangle", icon: Square },
    { name: "sticky-note", icon: StickyNote },
    { name: "text", icon: Type },
  ];

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-2">
        {tools.map((t) => (
          <Button
            key={t.name}
            variant="ghost"
            size="icon"
            onClick={() => setTool(t.name as any)}
            className={cn(tool === t.name && "bg-indigo-100 text-indigo-600")}
          >
            <t.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-2">
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-auto p-2">
                <div className="flex gap-1">
                    {COLORS.map(c => (
                        <Button
                            key={c}
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8 rounded-full", c === color && "ring-2 ring-indigo-500")}
                            style={{ backgroundColor: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>
            </PopoverContent>
        </Popover>
      </div>
      <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-2 mt-2">
        <Button variant="ghost" size="icon" onClick={undo}>
            <Undo className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={redo}>
            <Redo className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
