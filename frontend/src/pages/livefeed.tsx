import Updates from "../pages/page2/updates";
import Feed from "../pages/page2/feed";

const livefeed = () => {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-6">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-2 xl:grid-rows-[minmax(0,1fr)]">
        <Feed />
        <Updates />
      </div>
    </div>
  );
};

export default livefeed;
