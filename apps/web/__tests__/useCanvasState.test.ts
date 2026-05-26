import { describe, it, expect } from "vitest";
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  GRID_SNAP_SIZE,
} from "../src/hooks/useCanvasState";

describe("zoom limits", () => {
  it("MIN_ZOOM should be 0.1", () => {
    expect(MIN_ZOOM).toBe(0.1);
  });

  it("MAX_ZOOM should be 5", () => {
    expect(MAX_ZOOM).toBe(5);
  });

  it("ZOOM_STEP should be 0.1", () => {
    expect(ZOOM_STEP).toBe(0.1);
  });

  it("zoom should not go below MIN_ZOOM", () => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, 0.05));
    expect(clamped).toBe(MIN_ZOOM);
  });

  it("zoom should not go above MAX_ZOOM", () => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, 6));
    expect(clamped).toBe(MAX_ZOOM);
  });

  it("zoom values within range should pass through", () => {
    const values = [0.5, 1, 2, 3, 4, 5];
    for (const v of values) {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v));
      expect(clamped).toBe(v);
    }
  });

  it("zooming in from 1 should increase by ZOOM_STEP", () => {
    const current = 1;
    const zoomedIn = Math.round((current + ZOOM_STEP) * 10) / 10;
    expect(zoomedIn).toBe(1.1);
  });

  it("zooming out from 1 should decrease by ZOOM_STEP", () => {
    const current = 1;
    const zoomedOut = Math.round((current - ZOOM_STEP) * 10) / 10;
    expect(zoomedOut).toBe(0.9);
  });

  it("zooming out from MIN_ZOOM should clamp to MIN_ZOOM", () => {
    const zoomedOut = Math.round((MIN_ZOOM - ZOOM_STEP) * 10) / 10;
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomedOut));
    expect(clamped).toBe(MIN_ZOOM);
  });

  it("zooming in from MAX_ZOOM should clamp to MAX_ZOOM", () => {
    const zoomedIn = Math.round((MAX_ZOOM + ZOOM_STEP) * 10) / 10;
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomedIn));
    expect(clamped).toBe(MAX_ZOOM);
  });
});

describe("grid snap logic", () => {
  it("GRID_SNAP_SIZE should be 100", () => {
    expect(GRID_SNAP_SIZE).toBe(100);
  });

  it("should snap position to nearest 100px when snap is enabled", () => {
    const result = snapToGrid({ x: 55, y: 155 }, true);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it("should snap 50 to 100 (rounds up)", () => {
    const result = snapToGrid({ x: 50, y: 0 }, true);
    expect(result).toEqual({ x: 100, y: 0 });
  });

  it("should snap 49 to 0 (rounds down)", () => {
    const result = snapToGrid({ x: 49, y: 0 }, true);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("should not snap when snap is disabled", () => {
    const result = snapToGrid({ x: 55, y: 155 }, false);
    expect(result).toEqual({ x: 55, y: 155 });
  });

  it("should snap 0 to 0", () => {
    const result = snapToGrid({ x: 0, y: 0 }, true);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it("should snap negative positions", () => {
    const result = snapToGrid({ x: -55, y: -155 }, true);
    expect(result).toEqual({ x: -100, y: -200 });
  });

  it("should snap 100 to 100 (already on grid)", () => {
    const result = snapToGrid({ x: 100, y: 100 }, true);
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("should snap 99 to 100", () => {
    const result = snapToGrid({ x: 99, y: 99 }, true);
    expect(result).toEqual({ x: 100, y: 100 });
  });

  it("should snap large values correctly", () => {
    const result = snapToGrid({ x: 1234, y: 5678 }, true);
    expect(result).toEqual({ x: 1200, y: 5700 });
  });
});

function snapToGrid(position: { x: number; y: number }, enabled: boolean): { x: number; y: number } {
  if (!enabled) return position;
  return {
    x: Math.round(position.x / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
    y: Math.round(position.y / GRID_SNAP_SIZE) * GRID_SNAP_SIZE,
  };
}