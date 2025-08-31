"use client";

import type { Shape, Text as TextType, StickyNote as StickyNoteType, Path as PathType } from "@/hooks/use-whiteboard";
import React, { memo, useState, useEffect } from "react";
import getStroke from "perfect-freehand";

const HANDLE_SIZE = 8;

function getSvgPathFromStroke(stroke: number[][]) {
    if (!stroke || stroke.length === 0) return '';
  
    const d = stroke.reduce(
      (acc, [x0, y0], i, arr) => {
        const [x1, y1] = arr[(i + 1) % arr.length] || arr[0];
        acc.push(i === 0 ? `M ${x0},${y0}` : `L ${x0},${y0}`);
        return acc;
      },
      [] as string[]
    );
  
    return d.join(' ');
}


export const ShapeComponent = memo(function ShapeComponent({
  shape,
  isSelected,
  onPointerDown,
  onChange,
  onDoubleClick,
}: {
    shape: Shape,
    isSelected: boolean,
    onPointerDown: (e: React.PointerEvent, id: string) => void,
    onChange: (id: string, updates: Partial<Shape>) => void,
    onDoubleClick: (e: React.MouseEvent, id: string) => void
}) {
  const { id, type, x, y } = shape;

  const [text, setText] = useState((shape as TextType | StickyNoteType).text || "");
  const isEditing = (shape as TextType | StickyNoteType).isEditing;

  useEffect(() => {
    setText((shape as TextType | StickyNoteType).text || "");
  }, [(shape as TextType | StickyNoteType).text]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onPointerDown(e, id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === "text" || type === "sticky-note") {
        onDoubleClick(e, id);
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }

  const handleTextBlur = () => {
    onChange(id, { text, isEditing: false });
  }

  const handleTransform = (
    e: React.PointerEvent,
    handle: "top" | "right" | "bottom" | "left" | "top_left" | "top_right" | "bottom_left" | "bottom_right"
  ) => {
    if (shape.type === 'path') return;

    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const { width, height, x: shapeX, y: shapeY } = shape as Exclude<Shape, PathType>;
    const startWidth = width;
    const startHeight = height;
    const startShapeX = shapeX;
    const startShapeY = shapeY;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startShapeX;
      let newY = startShapeY;

      if (handle.includes("right")) {
        newWidth = Math.max(10, startWidth + dx);
      } else if (handle.includes("left")) {
        newWidth = Math.max(10, startWidth - dx);
        newX = startShapeX + dx;
      }

      if (handle.includes("bottom")) {
        newHeight = Math.max(10, startHeight + dy);
      } else if (handle.includes("top")) {
        newHeight = Math.max(10, startHeight - dy);
        newY = startShapeY + dy;
      }

      onChange(id, { x: newX, y: newY, width: newWidth, height: newHeight });
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const stroke = shape.type === 'path' ? getSvgPathFromStroke(
    getStroke(shape.points, {
      size: 8,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    })
  ) : '';

  return (
    <g onPointerDown={handlePointerDown} onDoubleClick={handleDoubleClick}>
      {type === "rectangle" && (
        <rect
          x={x}
          y={y}
          width={shape.width}
          height={shape.height}
          fill={shape.fill}
          stroke={isSelected ? "#3b82f6" : "transparent"}
          strokeWidth={2}
        />
      )}
      {type === "path" && (
        <path d={stroke} fill={shape.fill} stroke={shape.fill} strokeWidth={2} />
      )}
      {(type === "text" || type === "sticky-note") && (
        <foreignObject x={x} y={y} width={shape.width} height={shape.height}>
             {type === 'sticky-note' && 
                <div style={{ backgroundColor: shape.fill, width: '100%', height: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', }}></div>
            }
            <textarea
                style={{
                    width: '100%',
                    height: '100%',
                    border: isSelected ? '1px dashed #3b82f6' : 'none',
                    resize: 'none',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    padding: type === 'sticky-note' ? '8px' : '0px',
                    fontSize: (shape as TextType).fontSize,
                    position: type === 'sticky-note' ? 'absolute' : 'relative',
                    top: 0,
                    left: 0
                }}
                value={text}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                readOnly={!isEditing}
                placeholder={type === 'text' ? 'Add Text' : 'Sticky Note'}
            />
        </foreignObject>
      )}

      {isSelected && shape.type !== 'path' && (
        <>
          {/* Resize handles */}
          <rect
            x={x - HANDLE_SIZE / 2}
            y={y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="#3b82f6"
            cursor="nwse-resize"
            onPointerDown={(e) => handleTransform(e, "top_left")}
          />
           <rect
            x={x + (shape as Exclude<Shape, PathType>).width - HANDLE_SIZE / 2}
            y={y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="#3b82f6"
            cursor="nesw-resize"
            onPointerDown={(e) => handleTransform(e, "top_right")}
          />
           <rect
            x={x - HANDLE_SIZE / 2}
            y={y + (shape as Exclude<Shape, PathType>).height - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="#3b82f6"
            cursor="nesw-resize"
            onPointerDown={(e) => handleTransform(e, "bottom_left")}
          />
          <rect
            x={x + (shape as Exclude<Shape, PathType>).width - HANDLE_SIZE / 2}
            y={y + (shape as Exclude<Shape, PathType>).height - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            fill="#3b82f6"
            cursor="nwse-resize"
            onPointerDown={(e) => handleTransform(e, "bottom_right")}
          />
        </>
      )}
    </g>
  );
});
