import { useEffect, useMemo, useRef, useState } from "react";
import {
  createVehicles,
  hashCode,
  nearestRoadCongestion,
  renderFeedFrame,
} from "./liveFeedSim";

function useFeedCongestion(lat?: number, lon?: number): number | null {
  const [congestion, setCongestion] = useState<number | null>(null);
  useEffect(() => {
    if (typeof lat !== "number" || typeof lon !== "number") return;
    let active = true;
    nearestRoadCongestion(lat, lon).then((value) => {
      if (active) setCongestion(value);
    });
    return () => {
      active = false;
    };
  }, [lat, lon]);
  return congestion;
}

interface LiveFeedCanvasProps {
  cameraId: string;
  name: string;
  latitude?: number;
  longitude?: number;
  density?: number;
  animated?: boolean;
  className?: string;
}

export function LiveFeedCanvas({
  cameraId,
  name,
  latitude,
  longitude,
  density,
  animated = true,
  className,
}: LiveFeedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const seed = useMemo(() => hashCode(cameraId), [cameraId]);
  const roadCongestion = useFeedCongestion(latitude, longitude);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && (rect.width > 0 || rect.height > 0)) {
        setSize({ w: rect.width, h: rect.height });
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.w <= 0 || size.h <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(size.w * dpr);
    canvas.height = Math.round(size.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const congestion = density ?? roadCongestion ?? 28 + (seed % 34);
    const vehicles = createVehicles(seed, congestion);

    const draw = (now: number): void => {
      if (size.w <= 0 || size.h <= 0) return;
      renderFeedFrame(ctx, size.w, size.h, seed, congestion, now, vehicles);
      if (animated) rafRef.current = requestAnimationFrame(draw);
    };

    if (animated) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      renderFeedFrame(
        ctx,
        size.w,
        size.h,
        seed,
        congestion,
        Date.now(),
        vehicles,
      );
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [seed, roadCongestion, density, size.w, size.h, animated]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? "h-full w-full"}
      aria-label={`${name} simulated camera feed`}
    />
  );
}
