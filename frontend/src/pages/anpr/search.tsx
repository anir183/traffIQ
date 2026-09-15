import { useState } from "react";
import type { KeyboardEvent } from "react";

const TABS = ["Search by Plate", "Search by Camera", "Advanced Search"];

export default function PlateSearch({
  value,
  onChange,
  onSearch, // 1. Add this new prop
}: {
  value: string;
  onChange: (plate: string) => void;
  onSearch?: (plate: string, tab: string) => void; // Passes the plate AND the active tab
}) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const handleSearch = () => {
    // 2. Call onSearch instead of onChange when they hit Enter/Click
    if (onSearch) {
      onSearch(value.trim().toUpperCase(), activeTab); 
    } else {
      onChange(value.trim().toUpperCase());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="w-full max-w-xl">
      {/* ... (Your Tabs code stays exactly the same) ... */}

      <div className="flex items-stretch gap-3">
        <input
          type="text"
          value={value}
          // 3. onChange stays here so the text box updates as they type
          onChange={(e) => onChange(e.target.value.toUpperCase())} 
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