const CIRCUITS = [
  "Esplanade Circuit",
  "Joka Circuit",
  "Salt Lake Circuit",
  "Ballygunge Circuit",
  "Park Street Circuit",
  "New Town Circuit",
  "Ballygunge-Lanka Circuit",
  "Howrah Circuit",
];

export interface CameraInfo {
  id: string;
  name: string;
  circuit: string;
  status: "online" | "offline";
}

export const CAMERAS: CameraInfo[] = Array.from({ length: 40 }, (_, i) => ({
  id: `CAM_${String(i + 1).padStart(3, "0")}`,
  name: `CAM ${String(i + 1).padStart(3, "0")}`,
  circuit: CIRCUITS[i % CIRCUITS.length],
  status: "offline" as const,
}));

export function getCameraById(id: string): CameraInfo | undefined {
  return CAMERAS.find((c) => c.id === id);
}

export function getCameraNeighbors(id: string): {
  prev: CameraInfo;
  next: CameraInfo;
} | null {
  const idx = CAMERAS.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  return {
    prev: CAMERAS[(idx - 1 + CAMERAS.length) % CAMERAS.length],
    next: CAMERAS[(idx + 1) % CAMERAS.length],
  };
}

export function getCameraPosition(id: string): number | null {
  const idx = CAMERAS.findIndex((c) => c.id === id);
  return idx >= 0 ? idx + 1 : null;
}
