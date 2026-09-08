export interface VolumeSpeedPoint {
  time: string;
  volume: number;
  speed: number;
}

export const VOLUME_SPEED: VolumeSpeedPoint[] = [
  { time: "00:00", volume: 3200, speed: 34 },
  { time: "02:00", volume: 4100, speed: 40 },
  { time: "04:00", volume: 5400, speed: 41 },
  { time: "06:00", volume: 7600, speed: 33 },
  { time: "08:00", volume: 9800, speed: 30 },
  { time: "10:00", volume: 11600, speed: 38 },
  { time: "12:00", volume: 12800, speed: 27 },
  { time: "14:00", volume: 11400, speed: 22 },
  { time: "16:00", volume: 10200, speed: 18 },
  { time: "18:00", volume: 8600, speed: 24 },
  { time: "20:00", volume: 6800, speed: 26 },
  { time: "22:00", volume: 5200, speed: 30 },
];

export function getPeakVolume(): VolumeSpeedPoint {
  return VOLUME_SPEED.reduce((peak, point) =>
    point.volume > peak.volume ? point : peak,
  );
}

export function getSlowestPeriod(): VolumeSpeedPoint {
  return VOLUME_SPEED.reduce((slow, point) =>
    point.speed < slow.speed ? point : slow,
  );
}

export function getFastestPeriod(): VolumeSpeedPoint {
  return VOLUME_SPEED.reduce((fast, point) =>
    point.speed > fast.speed ? point : fast,
  );
}

export const VEHICLE_TYPE_MIX = [
  { label: "Car", percent: 58 },
  { label: "Bike", percent: 26 },
  { label: "Bus", percent: 8 },
  { label: "Truck", percent: 6 },
  { label: "Others", percent: 2 },
];
