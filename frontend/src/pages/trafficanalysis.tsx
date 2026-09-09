import OverviewRow from "./analysis/overview";
import Map from "./analysis/mapp";
import IncidentQueue from "./analysis/incident-queue";

const trafficanalysis = () => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <OverviewRow />
        <div className="flex min-h-[400px] flex-1 flex-col gap-4 lg:flex-row">
          <Map />
          <IncidentQueue />
        </div>
      </div>
    </div>
  );
};

export default trafficanalysis;
