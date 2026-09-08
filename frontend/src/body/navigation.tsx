import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Overview", end: true },
  { to: "/feed", label: "Live Feed", end: false },
  { to: "/anpr", label: "ANPR Intelligence", end: false },
  { to: "/incident", label: "Incident Management", end: false },
  { to: "/analysis", label: "Traffic Analysis", end: false },
];

const ADMIN_ITEMS = [
  { to: "/logs", label: "Show Logs", end: false },
  { to: "/admin", label: "Admin Panel", end: false },
];

function linkClass({ isActive }: { isActive: boolean; isPending: boolean }) {
  const base =
    "flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors";
  if (isActive)
    return `${base} bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900`;
  return `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100`;
}

function Nav() {
  return (
    <div className="flex w-full shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 lg:h-full lg:w-60 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <span className="px-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Navigation
        </span>
      </div>
      <hr className="my-3 hidden border-t border-slate-100 lg:block dark:border-slate-800" />

      <div className="flex flex-wrap gap-1 lg:flex-col">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={linkClass}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-5 hidden lg:block">
        <span className="px-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          System Administration
        </span>
        <hr className="my-3 border-t border-slate-100 dark:border-slate-800" />
        <div className="flex flex-col gap-1">
          {ADMIN_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-auto hidden rounded-xl bg-slate-50 p-3 lg:block dark:bg-slate-800/50">
        <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Active Area
        </span>
        <div className="mt-2 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Active Circuit
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Esplanade-Joka Circuit
          </span>
        </div>
      </div>
    </div>
  );
}

export default Nav;
