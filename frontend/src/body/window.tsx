import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

const Feed = lazy(() => import("../pages/livefeed"));
const Overview = lazy(() => import("../pages/trafficanalysis"));
const Incident = lazy(() => import("../pages/incidentmngmnt"));
const Anpr = lazy(() => import("../pages/anpr"));
const Admin = lazy(() => import("../pages/admin"));
const Logs = lazy(() => import("../pages/logs"));
const Analysis = lazy(() => import("../pages/stat"));

function App() {
  return (
    <div className="min-w-0 flex-1 overflow-auto rounded-2xl bg-white dark:bg-slate-900">
      <Suspense
        fallback={
          <div className="p-6 text-sm text-slate-400 dark:text-slate-500">
            Loading&hellip;
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/incident" element={<Incident />} />
          <Route path="/anpr" element={<Anpr />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
