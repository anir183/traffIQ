import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useSearch } from "../hooks/useSearch";
import type { SearchResult } from "../types/contract/search";

function ResultItem({
  result,
  onNavigate,
}: {
  result: SearchResult;
  onNavigate: (href: string) => void;
}) {
  const badge = result.type;
  return (
    <button
      type="button"
      onClick={() => onNavigate(result.href)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {badge}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-slate-800 dark:text-slate-100">
          {result.label}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {result.subtitle}
        </span>
      </span>
    </button>
  );
}

export default function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { items: results, loading } = useSearch(query.trim());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const visible = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search plates, cameras, alerts…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-9 pl-9 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
          /
        </kbd>
      </div>

      {visible && (
        <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="max-h-72 overflow-y-auto p-1.5">
            {loading && (
              <p className="px-2 py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                Searching&hellip;
              </p>
            )}
            {!loading && results.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                No matches for &ldquo;{query}&rdquo;
              </p>
            )}
            {!loading &&
              results.map((result) => (
                <ResultItem
                  key={`${result.type}-${result.href}`}
                  result={result}
                  onNavigate={(href) => {
                    setOpen(false);
                    setQuery("");
                    navigate(href);
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
