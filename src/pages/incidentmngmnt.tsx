import { useState } from "react";
import "./tailwind.css";
import Map from "../pages/incident/map";
import IncidentLogs from "../pages/incident/incidents";

type FilterKey = "all" | "active" | "investigating" | "resolved";

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: "all", label: "All", count: 12 },
  { key: "active", label: "Active", count: 5 },
  { key: "investigating", label: "Investigating", count: 3 },
  { key: "resolved", label: "Resolved", count: 4 },
];

const IncidentManagement = () => {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  return (
  <div className="flex flex-row gap-15">
    <div className="flex flex-col justify-center gap-12 w-[60%]">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-center items-start gap-2 mb-4!">
        <h1 className="text-[35px]  text-gray-900 pt-5!">
          Incident Management
        </h1>
        <p className="text-[20px] text-gray-500 mt-1">
          Track and manage traffic incidents and alerts
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-3  ">
        {FILTERS.map((filter) => {
          const isActive = filter.key === activeFilter;
          return (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`rounded-lg p-2! text-sm text-[20px]! transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          );
        })}
      </div>

      {/* Map + Incident list */}
      <div className="flex flex-row  gap-12 justify-start items-start">
        <Map />
        
      </div>
    </div>
    <IncidentLogs />
</div>
  );
};

export default IncidentManagement;