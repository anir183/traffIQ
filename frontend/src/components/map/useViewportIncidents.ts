import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import {
  type Bbox,
  type TomTomIncident,
  clampBoundsArea,
  fetchIncidents,
  isAbortError,
  paddedBounds,
} from './incidentsApi'

export interface ViewportIncidentsState {
  status: 'idle' | 'loading' | 'live' | 'error'
  incidentCount: number
  lastUpdatedAt: number | null
}

interface UseViewportIncidentsOptions {
  getMap: () => MapLibreMap | null
  onUpdate: (incidents: TomTomIncident[]) => void
  enabled?: boolean
  pollMs?: number
  paddingFraction?: number
  moveDebounceMs?: number
  cooldownMs?: number
  minShiftFraction?: number
  minZoomDelta?: number
}

const IDLE_STATE: ViewportIncidentsState = {
  status: 'idle',
  incidentCount: 0,
  lastUpdatedAt: null,
}

export function bboxFromMap(map: MapLibreMap): Bbox {
  const bounds = map.getBounds()
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }
}

function boundsKey(bounds: Bbox, zoom: number): string {
  const round = (value: number) => value.toFixed(4)
  return `${round(bounds.west)},${round(bounds.south)},${round(bounds.east)},${round(bounds.north)}@${zoom.toFixed(2)}`
}

export function useViewportIncidents({
  getMap,
  onUpdate,
  enabled = true,
  pollMs = 30000,
  paddingFraction = 0.15,
  moveDebounceMs = 500,
  cooldownMs = 2000,
  minShiftFraction = 0.1,
  minZoomDelta = 0.7,
}: UseViewportIncidentsOptions) {
  const [state, setState] = useState<ViewportIncidentsState>(IDLE_STATE)

  const getMapRef = useRef(getMap)
  const onUpdateRef = useRef(onUpdate)
  const runFetchRef = useRef<(reason: 'move' | 'poll' | 'force') => void>(() => {})

  const mountedRef = useRef(true)
  const attachedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const handlersRef = useRef<{ load: () => void; moveend: () => void } | null>(null)

  const lastFetchAtRef = useRef(0)
  const lastSuccessAtRef = useRef(0)
  const lastKeyRef = useRef<string | null>(null)
  const lastBoundsRef = useRef<Bbox | null>(null)
  const lastZoomRef = useRef<number | null>(null)
  const errorStreakRef = useRef(0)

  const runFetch = useCallback(
    (reason: 'move' | 'poll' | 'force') => {
      const map = getMapRef.current()
      if (!map) return

      const bounds = clampBoundsArea(paddedBounds(bboxFromMap(map), paddingFraction))
      const zoom = map.getZoom()
      const key = boundsKey(bounds, zoom)
      const now = Date.now()
      const isFresh =
        lastSuccessAtRef.current !== 0 && now - lastSuccessAtRef.current < pollMs * 0.8
      const sameView = key === lastKeyRef.current

      if (reason !== 'force' && sameView && isFresh) return

      if (reason === 'move' && lastBoundsRef.current && lastZoomRef.current !== null) {
        const last = lastBoundsRef.current
        const span = Math.max(bounds.east - bounds.west, bounds.north - bounds.south, 1e-6)
        const shifted =
          Math.abs(bounds.west - last.west) > span * minShiftFraction ||
          Math.abs(bounds.east - last.east) > span * minShiftFraction ||
          Math.abs(bounds.south - last.south) > span * minShiftFraction ||
          Math.abs(bounds.north - last.north) > span * minShiftFraction ||
          Math.abs(zoom - lastZoomRef.current) >= minZoomDelta
        if (!shifted && isFresh) return
      }

      const coolingDown = now - lastFetchAtRef.current < cooldownMs
      if (coolingDown) {
        if (cooldownRef.current) return
        const remaining = Math.max(cooldownMs - (now - lastFetchAtRef.current), 100)
        cooldownRef.current = setTimeout(() => {
          cooldownRef.current = null
          runFetchRef.current(reason)
        }, remaining)
        return
      }
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current)
        cooldownRef.current = null
      }

      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      lastFetchAtRef.current = now
      if (reason !== 'poll') {
        setState((s) => ({ ...s, status: 'loading' }))
      }

      fetchIncidents(bounds, controller.signal)
        .then((incidents) => {
          if (!mountedRef.current) return
          onUpdateRef.current(incidents)
          lastKeyRef.current = key
          lastBoundsRef.current = bounds
          lastZoomRef.current = zoom
          lastSuccessAtRef.current = Date.now()
          errorStreakRef.current = 0
          setState({
            status: 'live',
            incidentCount: incidents.length,
            lastUpdatedAt: Date.now(),
          })
        })
        .catch((err: unknown) => {
          if (isAbortError(err) || !mountedRef.current) return
          errorStreakRef.current += 1
          if (errorStreakRef.current === 1) {
            console.error('Failed to update traffic incidents', err)
          }
          setState((s) => ({ ...s, status: 'error' }))
        })
    },
    [cooldownMs, minShiftFraction, minZoomDelta, paddingFraction, pollMs],
  )

  useEffect(() => {
    getMapRef.current = getMap
    onUpdateRef.current = onUpdate
    runFetchRef.current = runFetch
  }, [getMap, onUpdate, runFetch])

  useEffect(() => {
    mountedRef.current = true
    if (!enabled) return

    let attachTimer: ReturnType<typeof setInterval> | null = null

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const startInterval = () => {
      stopInterval()
      intervalRef.current = setInterval(() => runFetch('poll'), pollMs)
    }

    const attach = () => {
      const map = getMapRef.current()
      if (!map || attachedRef.current) return
      attachedRef.current = true

      const load = () => runFetch('force')
      const moveend = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => runFetch('move'), moveDebounceMs)
      }

      handlersRef.current = { load, moveend }
      map.on('load', load)
      map.on('moveend', moveend)

      if (map.loaded()) runFetch('force')
      if (document.visibilityState === 'visible') startInterval()
    }

    attach()
    if (!attachedRef.current) {
      attachTimer = setInterval(attach, 100)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (attachedRef.current) {
          runFetch('force')
          startInterval()
        }
      } else {
        stopInterval()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mountedRef.current = false
      if (attachTimer) clearInterval(attachTimer)
      stopInterval()
      document.removeEventListener('visibilitychange', onVisibility)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (cooldownRef.current) clearTimeout(cooldownRef.current)
      if (abortRef.current) abortRef.current.abort()
      const map = getMapRef.current()
      const handlers = handlersRef.current
      if (map && handlers) {
        map.off('load', handlers.load)
        map.off('moveend', handlers.moveend)
      }
      handlersRef.current = null
      attachedRef.current = false
      errorStreakRef.current = 0
    }
  }, [enabled, moveDebounceMs, pollMs, runFetch])

  return {
    state,
    refresh: () => runFetch('force'),
  }
}