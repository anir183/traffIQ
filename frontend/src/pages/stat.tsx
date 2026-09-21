import { useState } from "react";
import StatCard from "../components/ui/stat-card";
import CameraCount from "./stat/cameraviewcount";
import VolumeSpeed from "./stat/volume-speed";
import VehicleGraph from "./stat/vehicletype";
import Insights from "./stat/insights";
import { useTrafficSummary } from "../hooks/useTrafficSummary";
import { metricsToStatCards } from "../types/ui/adapters";

const CONTROL_BUTTON_CLASS =
  "flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";
const TIME_RANGES = ["Last 24 Hours", "Last 7 Days", "Last 30 Days", "Custom"];
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
  timeRange?: string;
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

function TrafficAnalysisBody() {
  const { data } = useTrafficSummary();
  const cards = data
    ? metricsToStatCards(data.metrics)
    : [
        {
          label: "Total Vehicles",
          value: "—",
          change: "—",
          trend: "up" as const,
        },
        {
          label: "Unique Vehicles",
          value: "—",
          change: "—",
          trend: "up" as const,
        },
        {
          label: "Average Speed",
          value: "—",
          change: "—",
          trend: "down" as const,
        },
        {
          label: "Congestion Score",
          value: "—",
          change: "—",
          trend: "up" as const,
          invertTrendColor: true,
        },
      ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
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
    </>
  );
}

export default function TrafficAnalysisHeader({
  title = "Traffic Analysis",
  subtitle = "Detailed traffic insights and analytics",
  timeRange = "Last 24 Hours",
  onTimeRangeChange,
}: TrafficAnalysisHeaderProps) {
  const [activeRange, setActiveRange] = useState(timeRange);
  const [fromDate, setFromDate] = useState(new Date(2026, 8, 6));
  const [toDate, setToDate] = useState(new Date(2026, 8, 9));
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);

  const handleRangeSelect = (range: string) => {
    setActiveRange(range);
    onTimeRangeChange?.(range);
    setIsRangeOpen(false);
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
              className={CONTROL_BUTTON_CLASS}
              onClick={() => {
                setIsRangeOpen((open) => !open);
                setIsFromOpen(false);
                setIsToOpen(false);
              }}
            >
              {activeRange}
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
                    onClick={() => handleRangeSelect(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeRange === "Custom" && (
            <>
              <div className="relative">
                <button
                  type="button"
                  className={CONTROL_BUTTON_CLASS}
                  onClick={() => {
                    setIsFromOpen((open) => !open);
                    setIsToOpen(false);
                    setIsRangeOpen(false);
                  }}
                >
                  <span className="font-medium">FROM :</span>
                  {formatDate(fromDate)}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ▾
                  </span>
                </button>

                {isFromOpen && (
                  <DatePicker
                    selected={fromDate}
                    onSelect={(date) => {
                      setFromDate(date);
                      setIsFromOpen(false);
                    }}
                    onClose={() => setIsFromOpen(false)}
                  />
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  className={CONTROL_BUTTON_CLASS}
                  onClick={() => {
                    setIsToOpen((open) => !open);
                    setIsFromOpen(false);
                    setIsRangeOpen(false);
                  }}
                >
                  <span className="font-medium">TO :</span>
                  {formatDate(toDate)}
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    ▾
                  </span>
                </button>

                {isToOpen && (
                  <DatePicker
                    selected={toDate}
                    onSelect={(date) => {
                      setToDate(date);
                      setIsToOpen(false);
                    }}
                    onClose={() => setIsToOpen(false)}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <TrafficAnalysisBody />
    </div>
  );
}
