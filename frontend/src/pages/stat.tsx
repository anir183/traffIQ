import { useState } from "react";
import StatCard from "../components/ui/stat-card";
import CameraCount from "./stat/cameraviewcount";
import VolumeSpeed from "./stat/volume-speed";
import VehicleGraph from "./stat/vehicletype";
import Insights from "./stat/insights";

const TIME_RANGES = ["Last 24 Hours", "Last 7 Days", "Last 30 Days"];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface TrafficAnalysisHeaderProps {
  title?: string;
  subtitle?: string;
  date?: Date;
  timeRange?: string;
  onDateChange?: (date: Date) => void;
  onTimeRangeChange?: (range: string) => void;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
  return `${day} ${month} ${date.getFullYear()}`;
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
    new Date(selected.getFullYear(), selected.getMonth(), 1),
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="absolute right-0 z-10 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="flex h-7 items-center justify-center text-xs text-slate-400 dark:text-slate-500"
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
                  ? "bg-slate-900 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
                  : isToday
                    ? "font-medium text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
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
    date ?? new Date(2026, 8, 6),
  );
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isRangeOpen, setIsRangeOpen] = useState(false);

  const handleDateSelect = (newDate: Date) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => {
                setIsDateOpen((open) => !open);
                setIsRangeOpen(false);
              }}
            >
              <span className="font-medium">DATE :</span>
              {formatDate(selectedDate)}
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ▾
              </span>
            </button>

            {isDateOpen && (
              <DatePicker
                selected={selectedDate}
                onSelect={handleDateSelect}
                onClose={() => setIsDateOpen(false)}
              />
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => {
                setIsRangeOpen((open) => !open);
                setIsDateOpen(false);
              }}
            >
              {timeRange}
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ▾
              </span>
            </button>

            {isRangeOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Vehicles"
          value="125,430"
          change="14%"
          trend="up"
        />
        <StatCard
          label="Unique Vehicles"
          value="91,245"
          change="11%"
          trend="up"
        />
        <StatCard
          label="Average Speed"
          value="32.4 km/h"
          change="6%"
          trend="down"
        />
        <StatCard
          label="Congestion Score"
          value="68/100"
          change="6%"
          trend="up"
          invertTrendColor
        />
      </div>

      <div className="grid min-w-0 w-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <VolumeSpeed />
        </div>

        <div className="flex min-h-0 flex-col gap-6">
          <div className="min-h-0 grow basis-[240px] shrink-0">
            <CameraCount />
          </div>
          <div className="shrink-0">
            <VehicleGraph />
          </div>
        </div>
      </div>

      <Insights />
    </div>
  );
}
