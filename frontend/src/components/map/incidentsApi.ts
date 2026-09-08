import { API_KEY } from '../../config'

export type IncidentGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }

export interface TomTomIncident {
  type: 'Feature'
  properties?: {
    id?: string
    iconCategory?: number
    magnitudeOfDelay?: number
    events?: { description?: string; code?: number; iconCategory?: number }[]
    from?: string
    to?: string
    timeValidity?: string
    startTime?: string
    endTime?: string
  }
  geometry: IncidentGeometry
}

export interface Bbox {
  west: number
  south: number
  east: number
  north: number
}

export class IncidentApiError extends Error {
  readonly retryable: boolean

  constructor(message: string, retryable: boolean) {
    super(message)
    this.name = 'IncidentApiError'
    this.retryable = retryable
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

const MAX_BBOX_AREA_KM2 = 10000
const KM_PER_DEG_LAT = 110.57

export function paddedBounds(bounds: Bbox, fraction = 0.15): Bbox {
  const lngSpan = bounds.east - bounds.west
  const latSpan = bounds.north - bounds.south
  const padLng = lngSpan * fraction
  const padLat = latSpan * fraction
  return {
    west: bounds.west - padLng,
    south: bounds.south - padLat,
    east: bounds.east + padLng,
    north: bounds.north + padLat,
  }
}

export function clampBoundsArea(bounds: Bbox): Bbox {
  const kmPerDegLng =
    111.32 * Math.cos(((bounds.north + bounds.south) / 2) * (Math.PI / 180))
  const areaKm2 =
    (bounds.east - bounds.west) *
    kmPerDegLng *
    (bounds.north - bounds.south) *
    KM_PER_DEG_LAT

  if (areaKm2 <= MAX_BBOX_AREA_KM2) return bounds

  const scale = Math.sqrt(MAX_BBOX_AREA_KM2 / areaKm2)
  const centerLng = (bounds.west + bounds.east) / 2
  const centerLat = (bounds.south + bounds.north) / 2

  return {
    west: centerLng - ((bounds.east - bounds.west) / 2) * scale,
    south: centerLat - ((bounds.north - bounds.south) / 2) * scale,
    east: centerLng + ((bounds.east - bounds.west) / 2) * scale,
    north: centerLat + ((bounds.north - bounds.south) / 2) * scale,
  }
}

export function incidentAnchor(incident: TomTomIncident): [number, number] {
  if (incident.geometry.type === 'LineString') {
    const point = incident.geometry.coordinates[0]
    return [point[0], point[1]]
  }
  return [incident.geometry.coordinates[0], incident.geometry.coordinates[1]]
}

const FIELDS = encodeURIComponent(
  '{ incidents { type, geometry { type, coordinates }, properties { id, iconCategory, magnitudeOfDelay, events { description, code, iconCategory }, from, to, timeValidity, startTime, endTime } } }',
)

export function fetchIncidents(
  bounds: Bbox,
  signal?: AbortSignal,
): Promise<TomTomIncident[]> {
  const bbox = `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
  const url =
    `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${API_KEY}` +
    `&bbox=${bbox}&timeValidityFilter=present&fields=${FIELDS}&language=en-GB`

  return fetch(url, { signal })
    .then(async (response) => {
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500
        throw new IncidentApiError(
          `IncidentDetails request failed (${response.status})`,
          retryable,
        )
      }
      const data = (await response.json()) as { incidents?: TomTomIncident[] }
      return data.incidents ?? []
    })
    .catch((err: unknown) => {
      if (err instanceof IncidentApiError) throw err
      if (isAbortError(err)) throw err
      throw new IncidentApiError(
        err instanceof Error ? err.message : 'IncidentDetails request failed',
        true,
      )
    })
}