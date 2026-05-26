"use client";

import { useCallback, useRef, useState } from "react";

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 0.1;
export const GRID_SNAP_SIZE = 100;
export const MINOR_GRID_SIZE = 10;
export const MAJOR_GRID_SIZE = 100;

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface CanvasState {
  zoom: number;
  position: CanvasPosition;
  gridSnapEnabled: boolean;
  selectedId: string | null;
}

interface CanvasStateHistory {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

export function useCanvasState() {
  const [history, setHistory] = useState<CanvasStateHistory>({
    past: [],
    present: {
      zoom: 1,
      position: { x: 0, y: 0 },
      gridSnapEnabled: true,
      selectedId: null,
    },
    future: [],
  });

  const isPanning = useRef(false);

  const state = history.present;

  const pushState = useCallback((newState: Partial<CanvasState>) => {
    setHistory((prev) => {
      const next = { ...prev.present, ...newState };
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: [],
      };
    });
  }, []);

  const setZoom = useCallback((zoom: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    pushState({ zoom: clamped });
  }, [pushState]);

  const zoomIn = useCallback(() => {
    setZoom(Math.round((state.zoom + ZOOM_STEP) * 10) / 10);
  }, [state.zoom, setZoom]);

  const zoomOut = useCallback(() => {
    setZoom(Math.round((state.zoom - ZOOM_STEP) * 10) / 10);
  }, [state.zoom, setZoom]);

  const setPosition = useCallback((position: CanvasPosition) => {
    pushState({ position });
  }, [pushState]);

  const toggleGridSnap = useCallback(() => {
    pushState({ gridSnapEnabled: !state.gridSnapEnabled });
  }, [state.gridSnapEnabled, pushState]);

  const setSelectedId = useCallback((selectedId: string | null) => {
    pushState({ selectedId });
  }, [pushState]);

  const snapToGrid = useCallback(
    (position: CanvasPosition): CanvasPosition => {
      if (!state.gridSnapEnabled) return position;
      return {
        x: Math.round(position.x / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
        y: Math.round(position.y / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
      };
    },
    [state.gridSnapEnabled]
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state,
    isPanning,
    setZoom,
    zoomIn,
    zoomOut,
    setPosition,
    toggleGridSnap,
    setSelectedId,
    snapToGrid,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}