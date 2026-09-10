import { useState } from "react";
import type { KeyboardEvent } from "react";

const TABS = ["Search by Plate", "Search by Camera", "Advanced Search"];

export default function PlateSearch() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [plate, setPlate] = useState("WB02AM7555");

  const handleSearch = () => {
    console.log(`Searching "${activeTab}" for:`, plate);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="w-full max-w-xl">
      <div className="mb-6 flex items-center justify-center gap-8 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-slate-900 dark:text-slate-100"
                  : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              }`}
            >
              {tab}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-slate-900 dark:bg-slate-100" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-stretch gap-3">
        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Enter plate number"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm tracking-wide text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Search
        </button>
      </div>
    </div>
  );
}
