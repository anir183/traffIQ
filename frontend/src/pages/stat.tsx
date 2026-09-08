import { useState } from "react";
import Totalvehicles from '../pages/stat/totalvehicles';
import Uniquevehicles from '../pages/stat/uniquevehicles';
import Avgspeed from '../pages/stat/avgspeed';
import CongestionScore from '../pages/stat/congestion';
import VehicleGraph from '../pages/stat/vehicletype';
import TrafficVolume from '../pages/stat/trafficvolume';
import AverageSpeed from '../pages/stat/avgspeedgraph';
import CameraCount from '../pages/stat/cameraviewcount'

interface TrafficAnalysisHeaderProps {
  title?: string;
  subtitle?: string;
  date?: Date;
  timeRange?: string;
  onDateChange?: (date: Date) => void;
  onTimeRangeChange?: (range: string) => void;
}

const TIME_RANGES = ["Last 24 Hours", "Last 7 Days", "Last 30 Days"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DatePicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const [viewDate, setViewDate] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goToPrevMonth = () =>
    setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth = () =>
    setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="absolute right-0 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-10">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-gray-900">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="flex h-7 items-center justify-center text-xs text-gray-400"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const cellDate = new Date(year, month, day);
          const isSelected = isSameDay(cellDate, selected);
          const isToday = isSameDay(cellDate, new Date());

          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                onSelect(cellDate);
                onClose();
              }}
              className={`h-7 w-7 rounded-full text-xs transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white font-medium"
                  : isToday
                  ? "text-blue-600 font-medium hover:bg-gray-100"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TrafficAnalysisHeader({
  title = "Traffic Analysis",
  subtitle = "Detailed traffic insights and analytics",
  date,
  timeRange = "Last 24 Hours",
  onDateChange,
  onTimeRangeChange,
}: TrafficAnalysisHeaderProps) {
  const [selectedDate, setSelectedDate] = useState(
    date ?? new Date(2026, 8, 6) // 06 Sep 2026, matches the screenshot default
  );
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  const handleDateSelect = (newDate: Date) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  return (
    <div className="flex flex-col">
        <div className="flex flex-wrap pl-3! pr-12! items-center justify-between gap-5">
        <div>
            <h2 className="text-[35px] font-semibold text-gray-900">{title}</h2>
            <p className="text-[20px] pl-1! text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
            {/* Date picker */}
            <div className="relative">
            <button
                type="button"
                className="flex items-center gap-2 p-2! text-xl! rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                setIsDateOpen((open) => !open);
                setIsRangeOpen(false);
                }}
            >
                <span aria-hidden="true">DATE :</span>
                {formatDate(selectedDate)}
                <span className="text-gray-400 text-xs">▾</span>
            </button>

            {isDateOpen && (
                <DatePicker
                selected={selectedDate}
                onSelect={handleDateSelect}
                onClose={() => setIsDateOpen(false)}
                />
            )}
            </div>

            {/* Time range dropdown */}
            <div className="relative">
            <button
                type="button"
                className="flex text-xl! p-2! text-xl! items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                setIsRangeOpen((open) => !open);
                setIsDateOpen(false);
                }}
            >
                {timeRange}
                <span className="text-gray-400 text-xs">▾</span>
            </button>

            {isRangeOpen && (
                <div className="absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg z-10">
                {TIME_RANGES.map((range) => (
                    <button
                    key={range}
                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                        onTimeRangeChange?.(range);
                        setIsRangeOpen(false);
                    }}
                    >
                    {range}
                    </button>
                ))}
                </div>
            )}
            </div>
        </div>
        </div>
        <div className="flex flex-wrap mt-8! justify-between items-center w-[90%]">
            <Totalvehicles/>
            <Uniquevehicles/>
            <Avgspeed/>
            <CongestionScore/>

        </div>
        <div className="flex flex-row gap-12 pt-12!">
                        <CameraCount/>
        <div className="flex flex-wrap gap-1 justify-between items-center ">
            <TrafficVolume/>
            <AverageSpeed/>
            <VehicleGraph/>


        </div>
        </div>

    </div>
  );
}