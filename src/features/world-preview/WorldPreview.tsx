import { useEffect, useRef } from 'react';
import { renderPlayableWorldToCanvas } from '../../adapters/canvas/render-playable-world';
import type { GeneratedWorld } from '../../core/world-spec';

interface WorldPreviewProps {
  world: GeneratedWorld;
}

export function WorldPreview({ world }: WorldPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = Math.max(12, Math.min(28, Math.floor(760 / world.spec.map.width)));
    renderPlayableWorldToCanvas(canvas, world, cellSize);
  }, [world]);

  return (
    <div className="preview-frame">
      <canvas
        ref={canvasRef}
        className="world-canvas"
        aria-label={`Generated preview of ${world.spec.title}`}
      />
    </div>
  );
}
