import { useEffect, useRef, useState } from "react";
import { VOLUME_SPEED } from "./analysisData";

const VOLUME_Y_MAX = 15000;
const SPEED_Y_MAX = 60;

const VOLUME_TICKS = [0, 5000, 10000, 15000];
const SPEED_TICKS = [0, 20, 40, 60];
const X_LABEL_INTERVAL = 2;

const FALLBACK_WIDTH = 800;
const FALLBACK_HEIGHT = 220;

function formatVolumeLabel(value: number): string {
  return value === 0 ? "0" : `${value / 1000}K`;
}

interface Slot {
  time: string;
  volume: number;
  speed: number;
  barW: number;
  barX: number;
  barH: number;
  barY: number;
  lineX: number;
  lineY: number;
}

function buildSlots(width: number, height: number): Slot[] {
  const slotW = width / VOLUME_SPEED.length;
  return VOLUME_SPEED.map((point, i) => {
    const barW = Math.max(4, slotW * 0.55);
    const barX = i * slotW + (slotW - barW) / 2;
    const barH = (point.volume / VOLUME_Y_MAX) * height;
    const barY = height - barH;
    const lineX = i * slotW + slotW / 2;
    const lineY = height - (point.speed / SPEED_Y_MAX) * height;
    return { ...point, barW, barX, barH, barY, lineX, lineY };
  });
}

export default function VolumeSpeedChart() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({
    width: FALLBACK_WIDTH,
    height: FALLBACK_HEIGHT,
  });

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const compute = () => {
      const rect = svg.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(140, Math.round(rect.height));
      setSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height },
      );
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const slots = buildSlots(size.width, size.height);
  const linePath = slots
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.lineX} ${p.lineY}`)
    .join(" ");

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Traffic Volume &amp; Average Speed
        </h3>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
            Volume
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-0.5 w-4 rounded-full bg-emerald-500" />
            Avg speed
          </span>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1">
        <div className="flex w-10 shrink-0 flex-col justify-between pb-2 pr-1 text-xs text-slate-400 dark:text-slate-500">
          {[...VOLUME_TICKS].reverse().map((tick) => (
            <span key={tick}>{formatVolumeLabel(tick)}</span>
          ))}
        </div>

        <svg
          ref={svgRef}
          className="min-h-0 min-w-0 flex-1"
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient id="volumeGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {slots.map((p) => (
            <rect
              key={`${p.time}-bar`}
              x={p.barX}
              y={p.barY}
              width={p.barW}
              height={p.barH}
              fill="#3b82f6"
            >
              <title>{`${p.time}: ${p.volume.toLocaleString()} vehicles`}</title>
            </rect>
          ))}

          <path
            d={`${linePath} L ${slots[slots.length - 1].lineX} ${size.height} L ${slots[0].lineX} ${size.height} Z`}
            fill="url(#volumeGlow)"
            opacity={0.5}
          />
          <path
            d={linePath}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {slots.map((p) => (
            <circle key={p.time} cx={p.lineX} cy={p.lineY} r={3} fill="#10b981">
              <title>{`${p.time}: ${p.speed} km/h`}</title>
            </circle>
          ))}
        </svg>

        <div className="flex w-8 shrink-0 flex-col justify-between pb-2 pl-1 text-xs text-slate-400 dark:text-slate-500">
          {[...SPEED_TICKS].reverse().map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 pt-2">
        <div className="w-10 shrink-0" />
        <div className="flex min-w-0 flex-1">
          {slots.map((p, i) => (
            <div key={p.time} className="min-w-0 flex-1 text-center">
              {i % X_LABEL_INTERVAL === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {p.time}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="w-8 shrink-0" />
      </div>
    </div>
  );
}
