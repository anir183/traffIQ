import { useEffect, useState } from "react";

type IncidentStatus = "Active" | "Investigating" | "Resolved";

type IncidentIcon = "alert" | "warning" | "wrongway";

interface Incident {
  id: string;
  icon: IncidentIcon;
  title: string;
  detail: string; // plate number / description
  location: string;
  time: string; // e.g. "14:28"
  status: IncidentStatus;
}

// ---- Hardcoded data (swap this out with fetched JSON later) ----
const HARDCODED_INCIDENTS: Incident[] = [
  {
    id: "1",
    icon: "alert",
    title: "Blacklisted Vehicle",
    detail: "WB02AM7555",
    location: "Park Street",
    time: "14:28",
    status: "Active",
  },
  {
    id: "2",
    icon: "warning",
    title: "Accident",
    detail: "Multiple vehicles",
    location: "EM Bypass",
    time: "14:15",
    status: "Active",
  },
  {
    id: "3",
    icon: "alert",
    title: "Speed Violation",
    detail: "DLBCAX1234",
    location: "VIP Road",
    time: "13:52",
    status: "Investigating",
  },
  {
    id: "4",
    icon: "wrongway",
    title: "Wrong Way",
    detail: "Unknown Vehicle",
    location: "Sector V",
    time: "13:45",
    status: "Investigating",
  },
  {
    id: "5",
    icon: "wrongway",
    title: "Route Anomaly",
    detail: "MH01AB9876",
    location: "New Town",
    time: "12:30",
    status: "Resolved",
  },
];

// ---- Style maps ----
const ICON_STYLES: Record<
  IncidentIcon,
  { bg: string; fg: string; symbol: string }
> = {
  alert: { bg: "#fee2e2", fg: "#dc2626", symbol: "▲" },
  warning: { bg: "#fef3c7", fg: "#d97706", symbol: "▲" },
  wrongway: { bg: "#fef3c7", fg: "#d97706", symbol: "⟲" },
};

const STATUS_STYLES: Record<IncidentStatus, { bg: string; fg: string }> = {
  Active: { bg: "#fee2e2", fg: "#b91c1c" },
  Investigating: { bg: "#fef3c7", fg: "#a16207" },
  Resolved: { bg: "#dcfce7", fg: "#15803d" },
};

// ---- Data hook: currently returns hardcoded data, ready to be   ----
// ---- swapped for a real fetch / polling / websocket source     ----
function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>(HARDCODED_INCIDENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // --- Plug your real data source in here ---
    // Example (uncomment and adjust when ready):
    //
    // let cancelled = false;
    // async function fetchIncidents() {
    //   setIsLoading(true);
    //   try {
    //     const res = await fetch("/api/incidents");
    //     const data: Incident[] = await res.json();
    //     if (!cancelled) setIncidents(data);
    //   } catch (err) {
    //     if (!cancelled) setError("Failed to load incidents");
    //   } finally {
    //     if (!cancelled) setIsLoading(false);
    //   }
    // }
    // fetchIncidents();
    // const interval = setInterval(fetchIncidents, 15000); // poll every 15s
    // return () => {
    //   cancelled = true;
    //   clearInterval(interval);
    // };
  }, []);

  return { incidents, isLoading, error };
}

function IncidentRow({ incident }: { incident: Incident }) {
  const icon = ICON_STYLES[incident.icon];
  const status = STATUS_STYLES[incident.status];

  return (
    <div className=" w-[100%] h-[70%]! flex items-start gap-3 p-4!">
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center! justify-center rounded-full text-sm"
        style={{ backgroundColor: icon.bg, color: icon.fg }}
      >
        {icon.symbol}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{incident.title}</p>
        <p className="text-sm text-gray-500 truncate">{incident.detail}</p>
        <p className="text-sm text-gray-400">{incident.location}</p>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <span className="text-xs text-gray-400">{incident.time}</span>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: status.bg, color: status.fg }}
        >
          {incident.status}
        </span>
      </div>
    </div>
  );
}

export default function RecentIncidents() {
  const { incidents, isLoading, error } = useIncidents();

  return (
    <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[22px] font-semibold pl-4! pt-2! text-gray-900">
          Recent Incidents
        </h3>
      </div>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {isLoading && (
        <p className="text-xs text-gray-400 mt-2">Updating…</p>
      )}

      <div className="divide-y divide-gray-100">
        {incidents.map((incident) => (
          <IncidentRow key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}