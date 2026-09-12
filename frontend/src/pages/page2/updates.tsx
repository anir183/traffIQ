import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import { useAnprEvents } from "../../hooks/useAnprEvents";
import { anprEventToEntry } from "../../types/ui/adapters";
import type { VehicleType } from "../../types/traffic";
import type { AnprEvent, VehicleClass } from "../../types/contract/anprEvent";
import { useListPageSize } from "../../hooks/useListPageSize";
import InlineFetchStatus from "../../components/ui/fetch-status";
import Pagination from "../../components/ui/pagination";

const WS_URL =
  import.meta.env.VITE_WS_URL ?? "wss://websockettest-kkcj.onrender.com/ws";
const WS_TOPIC = import.meta.env.VITE_WS_TOPIC ?? "/topic/detections";
const WS_CONNECT_TIMEOUT_MS = 8_000;

interface WsDetection {
  id?: string | number;
  eventId?: string;
  localTrackId?: number;
  plateNumber?: string;
  vehicleType?: string;
  cameraId?: string;
  detectedAt?: string;
  speedKmh?: number;
  direction?: string;
  vehicleConfidence?: number;
  plateConfidence?: number;
}

function wsDetectionToEvent(raw: WsDetection): AnprEvent {
  const plateText = raw.plateNumber ?? "";
  const type = (raw.vehicleType ?? "other").toLowerCase() as VehicleClass;
  return {
    event_id: String(
      raw.eventId ?? raw.id ?? `ws_${Date.now()}_${Math.random()}`,
    ),
    event_type: "vehicle_anpr",
    camera_id: raw.cameraId ?? "—",
    timestamp: raw.detectedAt ?? new Date().toISOString(),
    local_track_id: Number(raw.localTrackId ?? 0),
    vehicle: {
      type,
      type_confidence: Number(raw.vehicleConfidence ?? 0),
      bbox: [0, 0, 0, 0],
    },
    plate: {
      text: plateText,
      confidence: Math.round((raw.plateConfidence ?? 0) * 100),
      format_valid: true,
      state_code: plateText.slice(0, 2).toUpperCase(),
      state_auto_corrected: false,
    },
    speed: {
      value_kmh: Number(raw.speedKmh ?? 0),
      estimated: true,
      direction: raw.direction ?? "unknown",
    },
  };
}

function wsMessageToEvents(payload: unknown): AnprEvent[] {
  const list = Array.isArray(payload) ? payload : [payload];
  return list.map((item) => wsDetectionToEvent(item as WsDetection));
}

const TYPE_STYLE: Record<
  VehicleType,
  { bg: string; fg: string; icon: string }
> = {
  Car: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    fg: "text-blue-700 dark:text-blue-400",
    icon: "🚗",
  },
  Truck: {
    bg: "bg-red-50 dark:bg-red-500/10",
    fg: "text-red-700 dark:text-red-400",
    icon: "🚚",
  },
  Bike: {
    bg: "bg-green-50 dark:bg-green-500/10",
    fg: "text-green-700 dark:text-green-400",
    icon: "🏍️",
  },
  Bus: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    fg: "text-amber-700 dark:text-amber-400",
    icon: "🚌",
  },
};

type FeedSource = "connecting" | "live" | "mock";

function AnprLog() {
  const mockFeed = useAnprEvents();
  const [source, setSource] = useState<FeedSource>("connecting");
  const [liveItems, setLiveItems] = useState<AnprEvent[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    const fallBackToMock = () => {
      if (!active) return;
      setSource((prev) => (prev === "live" ? prev : "mock"));
    };

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5_000,

      onConnect: () => {
        if (!active) return;
        setSource("live");

        client.subscribe(WS_TOPIC, (message) => {
          try {
            const events = wsMessageToEvents(JSON.parse(message.body));
            if (events.length === 0) return;
            setLiveItems((prev) => [...events, ...prev].slice(0, 200));
          } catch (err) {
            console.error("Failed to parse detection message:", err);
          }
        });
      },

      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        fallBackToMock();
      },

      onWebSocketError: (evt) => {
        console.error("WebSocket error:", evt);
        fallBackToMock();
      },
    });

    client.activate();

    const timeoutId = window.setTimeout(() => {
      if (!client.connected) fallBackToMock();
    }, WS_CONNECT_TIMEOUT_MS);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      void client.deactivate();
    };
  }, []);

  const isLive = source === "live";
  const items = isLive ? liveItems : mockFeed.items;
  const loading = isLive ? false : mockFeed.loading;
  const error = isLive ? null : mockFeed.error;

  const refetch = () => {
    if (isLive) {
      setPage(1);
    } else {
      mockFeed.refetch();
    }
  };

  const entries = items.map(anprEventToEntry);

  const filtered = entries.filter((e) =>
    e.vehicleNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
    { min: 5 },
    filtered.length,
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + rowsPerPage);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="flex w-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-800">
        <input
          className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {source === "live" ? (
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            title="Live detections via WebSocket"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        ) : source === "mock" ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            title="WebSocket unavailable — showing mock/rest data"
          >
            Mock
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
            Connecting
          </span>
        )}
      </div>

      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden">
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <th className="w-6 px-2 py-2.5 font-medium" />
              <th className="w-20 px-2 py-2.5 font-medium">Time</th>
              <th className="px-2 py-2.5 font-medium">Vehicle Number</th>
              <th className="w-24 px-2 py-2.5 font-medium">Camera</th>
              <th className="w-32 px-2 py-2.5 font-medium">Vehicle Type</th>
              <th className="w-24 px-2 py-2.5 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((entry) => (
              <tr
                key={entry.id}
                data-sm-row
                className="border-b border-slate-50 last:border-0 dark:border-slate-800/60"
              >
                <td className="px-2 py-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                </td>
                <td className="truncate px-2 py-2 text-slate-600 dark:text-slate-300">
                  {entry.time}
                </td>
                <td className="truncate px-2 py-2 font-medium text-slate-800 dark:text-slate-200">
                  {entry.vehicleNumber}
                </td>
                <td className="truncate px-2 py-2 text-slate-500 dark:text-slate-400">
                  {entry.camera}
                </td>
                <td className="px-2 py-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[entry.vehicleType].bg} ${TYPE_STYLE[entry.vehicleType].fg}`}
                  >
                    {TYPE_STYLE[entry.vehicleType].icon} {entry.vehicleType}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                    {entry.confidence}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <InlineFetchStatus
            loading={loading}
            hasData={filtered.length > 0}
            error={error}
            onRetry={refetch}
            emptyNote="No vehicles found."
          />
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
          <span className="text-slate-400 dark:text-slate-500">
            Showing {startIndex + 1}–{startIndex + pageItems.length} of{" "}
            {filtered.length}
          </span>

          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default AnprLog;
