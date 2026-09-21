export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const ELLIPSIS = "\u2026";

function pageItems(page: number, totalPages: number): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const items: Array<number | string> = [];
  let previous = 0;
  const sorted = [...wanted]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  for (const value of sorted) {
    if (value - previous > 1) items.push(ELLIPSIS);
    items.push(value);
    previous = value;
  }
  return items;
}

export default function Pagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  const safe = Math.min(Math.max(1, page), totalPages);
  if (totalPages <= 1) return null;

  const idle =
    "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800";
  const active =
    "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900";
  const nav =
    "rounded-md px-2 py-1 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={safe === 1}
        onClick={() => onChange(safe - 1)}
        className={nav}
      >
        {"\u2039"}
      </button>
      {pageItems(safe, totalPages).map((item, index) =>
        item === ELLIPSIS ? (
          <span
            key={`ellipsis-${index}`}
            className="px-0.5 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          >
            {ELLIPSIS}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item as number)}
            aria-current={item === safe ? "page" : undefined}
            className={`h-6 w-6 rounded-full text-xs transition-colors ${item === safe ? active : idle}`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={safe === totalPages}
        onClick={() => onChange(safe + 1)}
        className={nav}
      >
        Next {"\u203a"}
      </button>
    </div>
  );
}
