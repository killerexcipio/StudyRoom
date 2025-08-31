"use client";

import React from "react";
import type { Shape, Cursor, Text, StickyNote, Path } from "@/hooks/use-whiteboard";
import { ShapeComponent } from "./shape-component";

type CanvasProps = {
  shapes: Shape[];
  selectedShapeIds: string[];
  cursors: Cursor[];
  onCanvasPointerDown: (e: React.PointerEvent) => void;
  onCanvasPointerMove: (e: React.PointerEvent) => void;
  onCanvasPointerUp: (e: React.PointerEvent) => void;
  onShapePointerDown: (e: React.PointerEvent, shapeId: string) => void;
  onShapeChange: (shapeId: string, updates: Partial<Shape>) => void;
  onShapeDoubleClick: (e: React.MouseEvent, shapeId: string) => void;
};

export const Canvas = React.memo(function Canvas({
  shapes,
  selectedShapeIds,
  cursors,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onShapePointerDown,
  onShapeChange,
  onShapeDoubleClick,
}: CanvasProps) {
  return (
    <main className="flex-1 h-full w-full relative touch-none bg-gray-100">
      <svg
        className="w-full h-full"
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
      >
        <rect width="100%" height="100%" fill="transparent" />
        {shapes.map((shape) => (
          <ShapeComponent
            key={shape.id}
            shape={shape}
            isSelected={selectedShapeIds.includes(shape.id)}
            onPointerDown={(e) => onShapePointerDown(e, shape.id)}
            onChange={onShapeChange}
            onDoubleClick={(e) => onShapeDoubleClick(e, shape.id)}
          />
        ))}
      </svg>
    </main>
  );
});
