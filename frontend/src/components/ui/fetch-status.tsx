export interface InlineFetchStatusProps {
  loading: boolean;
  hasData: boolean;
  error: unknown;
  onRetry?: () => void;
  emptyNote?: string;
  errorNote?: string;
}

export default function InlineFetchStatus({
  loading,
  hasData,
  error,
  onRetry,
  emptyNote,
  errorNote,
}: InlineFetchStatusProps) {
  if (hasData) return null;
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
        Loading&hellip;
      </p>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm">
        <p className="text-slate-400 dark:text-slate-500">
          {errorNote ?? "Failed to load."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  return (
    <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
      {emptyNote ?? "No data."}
    </p>
  );
}
