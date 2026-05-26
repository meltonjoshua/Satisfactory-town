"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Konva from "konva";
import { Stage, Layer, Line } from "react-konva";
import { useCanvasState, MINOR_GRID_SIZE, MAJOR_GRID_SIZE } from "@/hooks/useCanvasState";

interface PlannerCanvasProps {
  width?: number;
  height?: number;
}

function GridLines({ zoom, position, width, height }: {
  zoom: number;
  position: { x: number; y: number };
  width: number;
  height: number;
}) {
  const lines: React.ReactNode[] = [];

  const startX = Math.floor((-position.x / zoom) / MAJOR_GRID_SIZE) * MAJOR_GRID_SIZE - MAJOR_GRID_SIZE;
  const endX = startX + width / zoom + MAJOR_GRID_SIZE * 2;
  const startY = Math.floor((-position.y / zoom) / MAJOR_GRID_SIZE) * MAJOR_GRID_SIZE - MAJOR_GRID_SIZE;
  const endY = startY + height / zoom + MAJOR_GRID_SIZE * 2;

  for (let x = startX; x < endX; x += MINOR_GRID_SIZE) {
    const isMajor = x % MAJOR_GRID_SIZE === 0;
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, startY, x, endY]}
        stroke={isMajor ? "#2d3748" : "#1a202c"}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    );
  }

  for (let y = startY; y < endY; y += MINOR_GRID_SIZE) {
    const isMajor = y % MAJOR_GRID_SIZE === 0;
    lines.push(
      <Line
        key={`h-${y}`}
        points={[startX, y, endX, y]}
        stroke={isMajor ? "#2d3748" : "#1a202c"}
        strokeWidth={isMajor ? 1 : 0.5}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}

export default function PlannerCanvas({ width: propWidth, height: propHeight }: PlannerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: propWidth ?? 800, height: propHeight ?? 600 });
  const canvas = useCanvasState();

  useEffect(() => {
    if (propWidth && propHeight) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [propWidth, propHeight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        canvas.undo();
      } else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        canvas.redo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (canvas.state.selectedId) {
          canvas.setSelectedId(null);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        canvas.toggleGridSnap();
      } else if (e.key === "+" || e.key === "=") {
        canvas.zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        canvas.zoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvas]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const scaleBy = 1.05;
      const stage = e.target.getStage();
      if (!stage) return;

      const oldScale = canvas.state.zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - canvas.state.position.x) / oldScale,
        y: (pointer.y - canvas.state.position.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.min(5, Math.max(0.1, newScale));

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      canvas.setZoom(clampedScale);
      canvas.setPosition(newPos);
    },
    [canvas]
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        canvas.isPanning.current = true;
        canvas.setSelectedId(null);
      }
    },
    [canvas]
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!canvas.isPanning.current) return;
      const stage = e.target.getStage();
      if (!stage) return;

      const dx = e.evt.movementX;
      const dy = e.evt.movementY;

      canvas.setPosition({
        x: canvas.state.position.x + dx,
        y: canvas.state.position.y + dy,
      });
    },
    [canvas]
  );

  const handleMouseUp = useCallback(() => {
    canvas.isPanning.current = false;
  }, [canvas]);

  const canvasWidth = dimensions.width;
  const canvasHeight = dimensions.height;

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-950">
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        scaleX={canvas.state.zoom}
        scaleY={canvas.state.zoom}
        x={canvas.state.position.x}
        y={canvas.state.position.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
          <GridLines
            zoom={canvas.state.zoom}
            position={canvas.state.position}
            width={canvasWidth}
            height={canvasHeight}
          />
        </Layer>
      </Stage>
      <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-gray-900/90 rounded-lg px-3 py-1.5 text-sm select-none">
        <span className="text-gray-400">
          {Math.round(canvas.state.zoom * 100)}%
        </span>
        {canvas.state.gridSnapEnabled && (
          <span className="text-green-500 text-xs border border-green-500/30 rounded px-1.5 py-0.5">
            SNAP
          </span>
        )}
      </div>
    </div>
  );
}