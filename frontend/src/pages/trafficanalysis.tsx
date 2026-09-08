import Analysis from "./analysis/detailF";
import Charts from "./analysis/stataf";
import DensityData from "./analysis/densityforecast";
import Map from "./analysis/mapp";
import IncidentQueue from "./analysis/incident-queue";

const trafficanalysis = () => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex min-h-[232px] flex-col gap-4 xl:flex-row">
          <Analysis />
          <Charts />
          <DensityData />
        </div>
        <div className="flex min-h-[400px] flex-1 flex-col gap-4 lg:flex-row">
          <Map />
          <IncidentQueue />
        </div>
      </div>
    </div>
  );
};

export default trafficanalysis;
