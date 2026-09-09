import { useState } from "react";
import Search from "../pages/anpr/search";
import Details from "../pages/anpr/details";
import Map from "../pages/anpr/map";

const INITIAL_PLATE = "WB02AM7555";

const Anpr = () => {
  const [plate, setPlate] = useState(INITIAL_PLATE);

  return (
    <div className="flex min-h-0 flex-col gap-6 p-6 lg:h-full">
      <div className="flex shrink-0 items-center justify-center gap-3">
        <span className="h-3 w-3 rounded-full bg-green-500" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Trajectory Recognition
        </h2>
      </div>
      <h3 className="shrink-0 text-center text-sm text-slate-500 dark:text-slate-400">
        Search vehicles by their number plate or nodal camera
      </h3>

      <div className="flex shrink-0 justify-center">
        <Search value={plate} onChange={setPlate} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 w-full flex-col lg:flex-1">
          <Details plate={plate} />
        </div>
        <div className="flex min-w-0 w-full flex-col lg:flex-1">
          <Map plate={plate} />
        </div>
      </div>
    </div>
  );
};

export default Anpr;
