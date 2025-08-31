
"use client";

import {
  useState,
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import * as WhiteboardService from "@/services/whiteboard-service";

export type Rectangle = {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
};

export type Path = {
  id: string;
  type: "path";
  points: number[][];
  fill: string;
  x: number;
  y: number;
}

export type Text = {
    id: string;
    type: "text";
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    text: string;
    isEditing?: boolean;
}

export type StickyNote = {
    id: string;
    type: "sticky-note";
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    text: string;
    isEditing?: boolean;
}


export type Shape = Rectangle | Path | Text | StickyNote;

export type Cursor = {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
};

type Tool = "select" | "rectangle" | "pen" | "eraser" | "sticky-note" | "text";

type WhiteboardState = {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
};

const WhiteboardStateContext = createContext<WhiteboardState | undefined>(
  undefined
);

export function WhiteboardStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#DC2626");
  return (
    <WhiteboardStateContext.Provider value={{ tool, setTool, color, setColor }}>
      {children}
    </WhiteboardStateContext.Provider>
  );
}

export const useWhiteboardState = () => {
  const context = useContext(WhiteboardStateContext);
  if (!context) {
    throw new Error(
      "useWhiteboardState must be used within a WhiteboardStateProvider"
    );
  }
  return context;
};

type HistoryEntry = {
  shapes: Shape[];
};

// Debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
  
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
      new Promise(resolve => {
        if (timeout) {
          clearTimeout(timeout);
        }
  
        timeout = setTimeout(() => resolve(func(...args)), waitFor);
      });
  };

export function useWhiteboard(whiteboardId: string) {
  const { tool, color } = useWhiteboardState();
  const { user } = useAuth();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionStartPoint = useRef<{ x: number; y: number } | null>(null);
  const interactionStartShapes = useRef<Shape[]>([]);
  const [cursors, setCursors] = useState<Cursor[]>([]);

  const history = useRef<HistoryEntry[]>([]);
  const historyIndex = useRef<number>(-1);
  const supabase = getSupabase();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const broadcastShapes = useCallback(
    (shapesToBroadcast: Shape[]) => {
      if (channelRef.current?.state === 'joined') {
        channelRef.current.send({
          type: "broadcast",
          event: "shapes-update",
          payload: { shapes: shapesToBroadcast, source: user?.id },
        });
      }
    },
    [user?.id]
  );
  
  const debouncedSave = useRef(
    debounce((shapesToSave: Shape[]) => {
      WhiteboardService.saveWhiteboardContent(whiteboardId, shapesToSave);
    }, 500)
  ).current;
  
  const updateShapesAndBroadcast = useCallback((newShapes: Shape[], saveToHistory: boolean) => {
    setShapes(newShapes);
    broadcastShapes(newShapes);
    if (saveToHistory) {
      if (historyIndex.current < history.current.length - 1) {
        history.current = history.current.slice(0, historyIndex.current + 1);
      }
      history.current.push({ shapes: newShapes });
      historyIndex.current = history.current.length - 1;
    }
    debouncedSave(newShapes);
  }, [broadcastShapes, debouncedSave]);

  const undo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current--;
      const newShapes = history.current[historyIndex.current].shapes;
      setShapes(newShapes);
      broadcastShapes(newShapes);
      debouncedSave(newShapes);
    }
  }, [broadcastShapes, debouncedSave]);

  const redo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      historyIndex.current++;
      const newShapes = history.current[historyIndex.current].shapes;
      setShapes(newShapes);
      broadcastShapes(newShapes);
      debouncedSave(newShapes);
    }
  }, [broadcastShapes, debouncedSave]);

  // Effect for fetching initial shapes and setting up real-time channel
  useEffect(() => {
    if (!user) return;

    const fetchAndSetShapes = async () => {
        try {
            const initialShapes = await WhiteboardService.fetchWhiteboardContent(whiteboardId);
            if (Array.isArray(initialShapes)) {
                setShapes(initialShapes);
                history.current = [{ shapes: initialShapes }];
                historyIndex.current = 0;
            }
        } catch (error) {
            console.error("Failed to fetch shapes", error);
        }
    };
    fetchAndSetShapes();

    const channel = supabase.channel(`whiteboard:${whiteboardId}`);
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        // Presence sync logic can be added here if needed
      })
      .on(
        "broadcast",
        { event: "shapes-update" },
        ({ payload }) => {
          if (payload.source !== user?.id) {
            setShapes(payload.shapes);
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [whiteboardId, supabase, user]);

  const onCanvasPointerDown = (e: React.PointerEvent) => {
    const point = [e.nativeEvent.offsetX, e.nativeEvent.offsetY, e.pressure];
    interactionStartPoint.current = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    setIsInteracting(true);

    if (tool === "select") {
      setSelectedShapeIds([]);
    } else if (tool === "rectangle" || tool === 'text' || tool === 'sticky-note') {
      const newShape: Shape = 
        tool === 'rectangle' ? {
            id: nanoid(),
            type: "rectangle",
            x: point[0], y: point[1], width: 0, height: 0,
            fill: color,
        } : tool === 'text' ? {
            id: nanoid(),
            type: 'text',
            x: point[0], y: point[1], width: 150, height: 50,
            fontSize: 24, text: "Text",
        } : {
            id: nanoid(),
            type: 'sticky-note',
            x: point[0], y: point[1], width: 200, height: 200,
            fill: '#FFF9B0', text: 'Sticky Note'
        };

      setShapes(prev => [...prev, newShape]);
      setSelectedShapeIds([newShape.id]);
    } else if (tool === "pen") {
        const newShape: Path = {
            id: nanoid(),
            type: "path",
            points: [point],
            fill: color,
            x: point[0],
            y: point[1],
        }
        setShapes(prev => [...prev, newShape]);
        setSelectedShapeIds([newShape.id]);
    }
  };

  const onCanvasPointerMove = (e: React.PointerEvent) => {
    const point = [e.nativeEvent.offsetX, e.nativeEvent.offsetY, e.pressure];

    if (!isInteracting) return;

    const selectedId = selectedShapeIds[0];
    
    if (tool === 'pen') {
        if (!selectedId) return;
        const newShapes = shapes.map(s => {
            if (s.id === selectedId && s.type === 'path') {
                return {...s, points: [...s.points, point]}
            }
            return s;
        });
        updateShapesAndBroadcast(newShapes, false);
    } else if (tool === "rectangle" && interactionStartPoint.current) {
        if (!selectedId) return;
        const newShapes = shapes.map((s) => {
            if (s.id === selectedId) {
                const currentShape = s as Rectangle;
                const width = point[0] - interactionStartPoint.current!.x;
                const height = point[1] - interactionStartPoint.current!.y;
                return { ...currentShape,
                    x: width > 0 ? interactionStartPoint.current!.x : point[0],
                    y: height > 0 ? interactionStartPoint.current!.y : point[1],
                    width: Math.abs(width),
                    height: Math.abs(height),
                };
            }
            return s;
        });
        updateShapesAndBroadcast(newShapes, false);
    }
  };

  const onCanvasPointerUp = () => {
    if (isInteracting) {
        let finalShapes = [...shapes];
        const shape = finalShapes.find(s => s.id === selectedShapeIds[0]);

        if (shape && shape.type === 'rectangle' && (shape.width < 5 || shape.height < 5)) {
            finalShapes = shapes.filter(s => s.id !== shape.id);
            setShapes(finalShapes);
        } else if (shape && (tool === 'text' || tool === 'sticky-note')) {
            onShapeDoubleClick(null, shape.id);
        }
        updateShapesAndBroadcast(finalShapes, true);
    }
    setIsInteracting(false);
    interactionStartPoint.current = null;
  };

  const onShapePointerDown = (e: React.PointerEvent, shapeId: string) => {
    e.stopPropagation();

    if (tool === 'eraser') {
        const newShapes = shapes.filter(s => s.id !== shapeId);
        updateShapesAndBroadcast(newShapes, true);
        return;
    }

    if (tool === "select") {
      setIsInteracting(true);
      setSelectedShapeIds((prev) =>
        e.shiftKey ? [...prev, shapeId] : [shapeId]
      );
      interactionStartPoint.current = { x: e.clientX, y: e.clientY };
      interactionStartShapes.current = shapes.map((s) => ({ ...s }));
    }
  };

  const onShapeChange = useCallback(
    (shapeId: string, updates: Partial<Shape>) => {
      const newShapes = shapes.map((s) =>
        s.id === shapeId ? { ...s, ...updates } : s
      );
      updateShapesAndBroadcast(newShapes, true);
    },
    [shapes, updateShapesAndBroadcast]
  );
  
  const onShapeDoubleClick = useCallback((e: React.MouseEvent | null, shapeId: string) => {
    e?.stopPropagation();
    const newShapes = shapes.map(s => {
        if (s.id === shapeId && (s.type === 'text' || s.type === 'sticky-note')) {
            return {...s, isEditing: true}
        }
        return {...s, isEditing: false};
    })
    setShapes(newShapes);
    setSelectedShapeIds([shapeId]);
  }, [shapes])

  const deleteSelectedShapes = () => {
    const newShapes = shapes.filter((s) => !selectedShapeIds.includes(s.id));
    setSelectedShapeIds([]);
    updateShapesAndBroadcast(newShapes, true);
  };

  // Effect for moving shapes
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isInteracting || tool !== "select" || !interactionStartPoint.current)
        return;

      const dx = e.clientX - interactionStartPoint.current.x;
      const dy = e.clientY - interactionStartPoint.current.y;

      const newShapes = shapes.map((s) => {
        if (selectedShapeIds.includes(s.id)) {
          const startShape = interactionStartShapes.current.find(
            (startS) => startS.id === s.id
          );
          if (startShape) {
            return {
              ...s,
              x: startShape.x + dx,
              y: startShape.y + dy,
            };
          }
        }
        return s;
      });
      updateShapesAndBroadcast(newShapes, false);
    };

    const handlePointerUp = () => {
      if (isInteracting && tool === 'select' && selectedShapeIds.length > 0) {
        updateShapesAndBroadcast(shapes, true);
      }
      setIsInteracting(false);
      interactionStartPoint.current = null;
      interactionStartShapes.current = [];
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    isInteracting,
    tool,
    selectedShapeIds,
    shapes,
    updateShapesAndBroadcast
  ]);

  return {
    shapes,
    selectedShapeIds,
    cursors,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
    onShapePointerDown,
    onShapeChange,
    onShapeDoubleClick,
    deleteSelectedShapes,
    undo,
    redo,
  };
}
