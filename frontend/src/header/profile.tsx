import ProfilePic from "../assets/profile1.webp";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "../theme/ThemeToggle";
import { useAuth } from "../auth/useAuth";

function App() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 border-r border-slate-200 pr-4 dark:border-slate-700">
        <ThemeToggle />
        <NotificationBell />
      </div>
      <div className="hidden text-right md:block">
        <p className="text-sm font-medium leading-tight text-slate-900 dark:text-slate-100">
          {user?.full_name ?? "Guest"}
        </p>
        <p className="text-xs leading-tight text-slate-500 dark:text-slate-400">
          {user?.department ?? "Traffic Control"}
        </p>
      </div>
      <img
        className="h-9 w-9 rounded-full border border-slate-200 object-cover"
        src={ProfilePic}
        alt="Profile"
      />
    </div>
  );
}

export default App;
