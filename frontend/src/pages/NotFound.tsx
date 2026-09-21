import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-semibold text-slate-300 dark:text-slate-600">
        404
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        Back to Overview
      </Link>
    </div>
  );
}

export default NotFound;
