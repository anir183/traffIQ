import { fetchRoadFlow, ROADS } from "../../api/tomtom/flow";

export function hashCode(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VEHICLE_COLORS = ["#fbbf24", "#f87171", "#60a5fa", "#e2e8f0", "#34d399"];

export interface SimVehicle {
  lane: number;
  progress: number;
  speed: number;
  color: string;
  offset: number;
}

export function createVehicles(seed: number, congestion: number): SimVehicle[] {
  const rng = mulberry32(seed);
  const count =
    3 +
    Math.min(12, Math.round((congestion / 100) * 12) + (rng() > 0.5 ? 1 : 0));
  return Array.from({ length: count }, () => ({
    lane: rng() > 0.5 ? 0 : 1,
    progress: rng() * 2.4,
    speed: 0.0014 + rng() * 0.0028 - (congestion / 130) * 0.002,
    color: VEHICLE_COLORS[Math.floor(rng() * VEHICLE_COLORS.length)],
    offset: (rng() - 0.5) * 0.55,
  }));
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function nearestRoadCongestion(
  lat: number,
  lon: number,
): Promise<number | null> {
  const samples = await fetchRoadFlow().catch(() => null);
  if (!samples || samples.length === 0) return null;
  let best: (typeof samples)[number] | null = null;
  let bestDist = Infinity;
  for (const sample of samples) {
    const road = ROADS.find((r) => r.name === sample.roadName);
    if (!road) continue;
    const dist = haversineKm(lat, lon, road.lat, road.lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = sample;
    }
  }
  if (
    !best ||
    best.currentSpeed == null ||
    best.freeFlowSpeed == null ||
    best.freeFlowSpeed <= 0
  ) {
    return null;
  }
  const ratio = Math.min(best.currentSpeed / best.freeFlowSpeed, 1);
  return Math.max(0, Math.min(100, (1 - ratio) * 100));
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function fmtTime(now: number): string {
  const d = new Date(now);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Draws one frame of a simulated traffic-corridor feed. Shared by the live
 * player (animated) and the grid tiles (single static frame).
 */
export function renderFeedFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
  congestion: number,
  now: number,
  vehicles: SimVehicle[],
): void {
  const rng = mulberry32(seed);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(0.5, "#1e293b");
  bg.addColorStop(1, "#111827");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const farHalf = Math.min(width, height) * 0.16;
  const nearHalf = Math.min(width, height) * 0.42;
  const topY = height * 0.04;
  const botY = height * 0.96;
  const halfAt = (t: number): number => farHalf + (nearHalf - farHalf) * t;
  const yAt = (t: number): number => topY + (botY - topY) * t;

  ctx.fillStyle = "#293241";
  ctx.beginPath();
  ctx.moveTo(cx - farHalf, topY);
  ctx.lineTo(cx + farHalf, topY);
  ctx.lineTo(cx + nearHalf, botY);
  ctx.lineTo(cx - nearHalf, botY);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 3;
  for (const [factor, dashed] of [
    [1, false],
    [0.5, true],
    [-0.5, true],
    [-1, false],
  ] as Array<[number, boolean]>) {
    ctx.setLineDash(dashed ? [10, 12] : []);
    ctx.lineWidth = dashed ? 2 : 3.5;
    ctx.beginPath();
    ctx.moveTo(cx + halfAt(0) * factor, topY);
    ctx.lineTo(cx + halfAt(1) * factor, botY);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  ctx.save();
  ctx.fillStyle = "rgba(148, 163, 184, 0.18)";
  for (let i = 0; i < 3; i += 1) {
    const x = cx + (rng() - 0.5) * farHalf * 1.6;
    const w = 10 + rng() * 20;
    ctx.fillRect(x, 0, w, height);
  }
  ctx.restore();

  for (const vehicle of vehicles) {
    vehicle.progress += vehicle.speed * (congestion > 55 ? 0.55 : 1);
    const tIn = vehicle.progress % 1;
    const t = vehicle.lane === 0 ? 1 - tIn : tIn;
    const hw = halfAt(t);
    const y = yAt(t);
    const laneCx = cx + (vehicle.lane === 0 ? -hw * 0.5 : hw * 0.5);
    const vwidth = hw * 0.55;
    const vheight = hw * 0.72;
    const x = laneCx + vehicle.offset * hw * 0.6 - vwidth / 2;

    ctx.save();
    ctx.translate(x + vwidth / 2, y);
    ctx.scale(1, vehicle.lane === 0 ? -1 : 1);
    ctx.globalAlpha = 0.92;
    roundRectPath(ctx, -vwidth / 2, -vheight / 2, vwidth, vheight, 2);
    ctx.fillStyle = vehicle.color;
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(
      -vwidth / 2 + 1,
      -vheight / 2 + 1,
      vwidth - 2,
      Math.max(1, vheight * 0.16),
    );
    ctx.restore();
  }

  ctx.textBaseline = "middle";
  ctx.font = "600 11px system-ui, sans-serif";

  const liveDotX = 12;
  const liveY = 16;
  const blink = Math.floor(now / 500) % 2 === 0;
  if (blink) {
    ctx.beginPath();
    ctx.fillStyle = "#ef4444";
    ctx.arc(liveDotX, liveY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#fecaca";
  ctx.fillText("LIVE", liveDotX + 10, liveY + 1);

  const time = fmtTime(now);
  ctx.fillStyle = "#cbd5e1";
  ctx.textAlign = "right";
  ctx.fillText(time, width - 12, liveY + 1);
  ctx.textAlign = "left";

  const label = "SIMULATED FEED · POC";
  ctx.font = "500 10px system-ui, sans-serif";
  const labelWidth = ctx.measureText(label).width + 18;
  const labelX = (width - labelWidth) / 2;
  const labelY = height - 18;
  ctx.fillStyle = "rgba(2, 6, 23, 0.6)";
  roundRectPath(ctx, labelX, labelY - 9, labelWidth, 18, 9);
  ctx.fill();
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(label, labelX + 9, labelY);
}
