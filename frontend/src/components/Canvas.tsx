import { useCallback, useEffect, useRef, useState } from "react";
import type { Point } from "../services/api";

interface CanvasProps {
  strokes: { points: Point[] }[];
  isDrawer: boolean;
  onDraw: (points: Point[]) => void;
  onClear: () => void;
}

export function Canvas({ strokes, isDrawer, onDraw, onClear }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<Point[]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let index = 1; index < stroke.points.length; index += 1) {
        ctx.lineTo(stroke.points[index].x, stroke.points[index].y);
      }
      ctx.stroke();
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  function getCanvasPoint(event: React.MouseEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function handleMouseDown(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;
    setIsDrawing(true);
    currentStroke.current = [getCanvasPoint(event)];
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const point = getCanvasPoint(event);
    currentStroke.current.push(point);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(currentStroke.current[currentStroke.current.length - 2].x, currentStroke.current[currentStroke.current.length - 2].y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function handleMouseUp() {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.current.length > 0) {
      onDraw([...currentStroke.current]);
      currentStroke.current = [];
    }
  }

  function handleMouseLeave() {
    if (isDrawing) {
      handleMouseUp();
    }
  }

  return (
    <div className="canvas-container" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{
          border: "1px solid #e5e7eb",
          display: "block",
          width: "100%",
          height: "auto",
          aspectRatio: "600 / 400",
          cursor: isDrawer ? "crosshair" : "default",
          backgroundColor: "#ffffff"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {isDrawer && (
        <div className="button-row button-row--compact" style={{ marginTop: "0.5rem" }}>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear Canvas
          </button>
        </div>
      )}
    </div>
  );
}
