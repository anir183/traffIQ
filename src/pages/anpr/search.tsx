import { useState } from "react";

const TABS = ["Search by Plate", "Search by Camera", "Advanced Search"];

export default function PlateSearch() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [plate, setPlate] = useState("WB02AM7555");

  const handleSearch = () => {
    console.log(`Searching "${activeTab}" for:`, plate);
  };

  const handleKeyDown = (e : any) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="w-[800px] text-4xl!">
      {/* Tabs */}
      <div className="flex items-center gap-12 justify-center border-gray-200 mb-8!">
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative text-2xl  transition-colors justify-center items-center ${
                isActive
                  ? "text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search row */}
      <div className="flex items-stretch gap-3">
        <input
          type="text"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Enter plate number"
          className="flex-1 rounded-3xl border pl-4! pt-2! pb-2! border-gray-300 px-4 py-2.5 text-2xl  text-gray-800 tracking-wide placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          className="rounded-3xl bg-blue-600 px-6 py-2.5 text-3xl w-[150px] font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Search
        </button>
      </div>
    </div>
  );
}