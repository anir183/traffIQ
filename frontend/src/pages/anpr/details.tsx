// import { useState, useEffect } from "react";
// import { useListPageSize } from "../../hooks/useListPageSize";
// import InlineFetchStatus from "../../components/ui/fetch-status";
// import Pagination from "../../components/ui/pagination";

// // 1. Variable for the custom history API URL
// const HISTORY_API_URL = import.meta.env.VITE_HISTORY_API_URL ??"http://localhost:3000/api/history?limit=10";

// export default function VehicleInformation({ plate }: { plate: string }) {
//   // A single state to hold both vehicle details and trajectory history
//   const [apiData, setApiData] = useState<{ vehicle?: any; trajectory?: any[] } | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
//   const [page, setPage] = useState(1);

//   const fetchData = () => {
//     let active = true;
//     setLoading(true);
//     setError(null);

//     const url = new URL(HISTORY_API_URL);
//     url.searchParams.append("plate", plate);

//     // Fetch from the custom URL dynamically using the searched plate!
//     fetch(url.toString())
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to fetch data from API");
//         return res.json();
//       })
//       .then((json) => {
//         if (!active) return;
//         setApiData(json);
//       })
//       .catch((err) => {
//         if (!active) return;
//         console.error("Failed to fetch custom data from", HISTORY_API_URL, err);
//         setError(err instanceof Error ? err : new Error(String(err)));
//       })
//       .finally(() => {
//         if (active) setLoading(false);
//       });

//     return () => {
//       active = false;
//     };
//   };

//   useEffect(() => {
//     if (!plate) {
//       setApiData(null);
//       return;
//     }
//     const cleanup = fetchData();
//     return cleanup;
//   }, [plate]);

//   // Extract the specific fields based on your JSON format
//   const vehicle = apiData?.vehicle;
//   const history = apiData?.trajectory ?? [];
//   const columns = history.length > 0 ? Object.keys(history[0]) : [];

//   // Check if the returned plate matches the searched plate
//   const isDataMismatch = apiData && (!vehicle || vehicle.plateNumber?.toUpperCase() !== plate.toUpperCase());

//   const { containerRef, rowsPerPage } = useListPageSize<HTMLDivElement>(
//     { min: 4 },
//     history.length,
//   );

//   const totalPages = Math.max(1, Math.ceil(history.length / rowsPerPage));
//   const safePage = Math.min(page, totalPages);
//   const startIndex = (safePage - 1) * rowsPerPage;
//   const pageRecords = history.slice(startIndex, startIndex + rowsPerPage);

//   // Helper to format the top grid data
//   const formatDate = (isoString?: string) => {
//     if (!isoString) return "—";
//     return new Date(isoString).toLocaleString();
//   };

//   const vehicleDetails = vehicle ? [
//     { label: "Plate Number", value: vehicle.plateNumber ?? "—" },
//     { label: "Vehicle Type", value: vehicle.vehicleType ?? "—" },
//     { label: "First Seen", value: formatDate(vehicle.firstSeen) },
//     { label: "Last Seen", value: formatDate(vehicle.lastSeen) },
//     { label: "Total Detections", value: String(vehicle.totalDetections ?? 0) },
//   ] : [];

//   return (
//     <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
//       <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
//         Vehicle Information
//       </h3>

//       {loading && !apiData ? (
//         <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
//           Loading&hellip;
//         </p>
//       ) : !apiData && error ? (
//         <InlineFetchStatus
//           loading={loading}
//           hasData={false}
//           error={error}
//           onRetry={fetchData}
//           emptyNote="Failed to load API data."
//         />
//       ) : isDataMismatch ? (
//         <div className="flex flex-1 flex-col items-center justify-center">
//           <p className="text-lg font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
//             NO DATA FOUND ....
//           </p>
//         </div>
//       ) : (
//         <>
//           <div className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4">
//             {vehicleDetails.map((row) => (
//               <div key={row.label} className="flex flex-col gap-0.5">
//                 <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
//                   {row.label}
//                 </dt>
//                 <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">
//                   {row.value}
//                 </dd>
//               </div>
//             ))}
//           </div>

//           <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

//           <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
//             VEHICLE HISTORY DETAILS
//           </h4>

//           <div
//             ref={containerRef}
//             className="min-h-0 flex-1 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800"
//           >
//             <table className="w-full border-collapse text-sm text-left">
//               <thead>
//                 <tr className="border-b border-slate-100 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
//                   <th className="w-6 px-3 py-2 font-medium" />
//                   {columns.map((col) => (
//                     <th key={col} className="px-3 py-2 font-medium whitespace-nowrap capitalize">
//                       {/* Convert camelCase to Space Case automatically */}
//                       {col.replace(/([A-Z])/g, ' $1').trim()}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {pageRecords.map((record, index) => (
//                   <tr
//                     key={index}
//                     data-sm-row
//                     className="border-b border-slate-50 last:border-0 dark:border-slate-800/60"
//                   >
//                     <td className="px-3 py-2">
//                       <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
//                     </td>
//                     {columns.map((col) => {
//                       const val = record[col];
//                       const displayVal = typeof val === "object" ? JSON.stringify(val) : String(val ?? "—");
//                       return (
//                         <td 
//                           key={col} 
//                           className="px-3 py-2 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" 
//                           title={displayVal}
//                         >
//                           {displayVal}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {pageRecords.length === 0 && !loading && (
//               <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
//                 No history returned from API.
//               </p>
//             )}
//           </div>

//           {history.length > 0 && (
//             <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
//               <span className="text-slate-400 dark:text-slate-500">
//                 Showing {startIndex + 1}–{startIndex + pageRecords.length} of{" "}
//                 {history.length}
//               </span>

//               {totalPages > 1 && (
//                 <Pagination
//                   page={safePage}
//                   totalPages={totalPages}
//                   onChange={setPage}
//                 />
//               )}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useListPageSize } from "../../hooks/useListPageSize";
import InlineFetchStatus from "../../components/ui/fetch-status";
import Pagination from "../../components/ui/pagination";

// Backend trajectory API
const HISTORY_API_URL =
  import.meta.env.VITE_HISTORY_API_URL ??
  "https://traffiq-backend-k1tw.onrender.com/api/vehicles/trajectory";

export default function VehicleInformation({ plate }: { plate: string }) {

  // Holds both vehicle details and trajectory history
  const [apiData, setApiData] = useState<{
    vehicle?: any;
    trajectory?: any[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = () => {

    let active = true;

    setLoading(true);
    setError(null);

    const url = new URL(HISTORY_API_URL);

    // Backend expects "plateNumber"
    url.searchParams.append("plateNumber", plate);

    fetch(url.toString())
      .then((res) => {

        if (!res.ok) {
          throw new Error("Failed to fetch data from API");
        }

        return res.json();
      })
      .then((json) => {

        if (!active) return;

        setApiData(json);
      })
      .catch((err) => {

        if (!active) return;

        console.error(
          "Failed to fetch custom data from",
          HISTORY_API_URL,
          err
        );

        setError(
          err instanceof Error
            ? err
            : new Error(String(err))
        );
      })
      .finally(() => {

        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  };

  useEffect(() => {

    if (!plate) {
      setApiData(null);
      return;
    }

    const cleanup = fetchData();

    return cleanup;

  }, [plate]);

  // Backend response
  const vehicle = apiData?.vehicle;
  const history = apiData?.trajectory ?? [];

  const columns =
    history.length > 0
      ? Object.keys(history[0])
      : [];

  // Check whether returned vehicle matches searched plate
  const isDataMismatch =
    apiData &&
    (
      !vehicle ||
      vehicle.plateNumber?.toUpperCase() !==
      plate.toUpperCase()
    );

  const {
    containerRef,
    rowsPerPage
  } = useListPageSize<HTMLDivElement>(
    { min: 4 },
    history.length
  );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        history.length / rowsPerPage
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const startIndex =
    (safePage - 1) * rowsPerPage;

  const pageRecords =
    history.slice(
      startIndex,
      startIndex + rowsPerPage
    );

  // Format date
  const formatDate = (
    isoString?: string
  ) => {

    if (!isoString) {
      return "—";
    }

    return new Date(
      isoString
    ).toLocaleString();
  };

  // Vehicle information displayed at top
  const vehicleDetails = vehicle
    ? [
      {
        label: "Plate Number",
        value: vehicle.plateNumber ?? "—"
      },
      {
        label: "Vehicle Type",
        value: vehicle.vehicleType ?? "—"
      },
      {
        label: "First Seen",
        value: formatDate(
          vehicle.firstSeen
        )
      },
      {
        label: "Last Seen",
        value: formatDate(
          vehicle.lastSeen
        )
      },
      {
        label: "Total Detections",
        value: String(
          vehicle.totalDetections ?? 0
        )
      }
    ]
    : [];

  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">

      <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
        Vehicle Information
      </h3>

      {loading && !apiData ? (

        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          Loading&hellip;
        </p>

      ) : !apiData && error ? (

        <InlineFetchStatus
          loading={loading}
          hasData={false}
          error={error}
          onRetry={fetchData}
          emptyNote="Failed to load API data."
        />

      ) : isDataMismatch ? (

        <div className="flex flex-1 flex-col items-center justify-center">

          <p className="text-lg font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            NO DATA FOUND ....
          </p>

        </div>

      ) : (

        <>

          {/* Vehicle information */}

          <div className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4">

            {vehicleDetails.map((row) => (

              <div
                key={row.label}
                className="flex flex-col gap-0.5"
              >

                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {row.label}
                </dt>

                <dd className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {row.value}
                </dd>

              </div>

            ))}

          </div>

          <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

          <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            VEHICLE HISTORY DETAILS
          </h4>

          {/* Trajectory history */}

          <div
            ref={containerRef}
            className="min-h-0 flex-1 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800"
          >

            <table className="w-full border-collapse text-sm text-left">

              <thead>

                <tr className="border-b border-slate-100 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">

                  <th className="w-6 px-3 py-2 font-medium" />

                  {columns.map((col) => (

                    <th
                      key={col}
                      className="px-3 py-2 font-medium whitespace-nowrap capitalize"
                    >
                      {col
                        .replace(
                          /([A-Z])/g,
                          " $1"
                        )
                        .trim()}
                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {pageRecords.map(
                  (record, index) => (

                    <tr
                      key={index}
                      data-sm-row
                      className="border-b border-slate-50 last:border-0 dark:border-slate-800/60"
                    >

                      <td className="px-3 py-2">

                        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />

                      </td>

                      {columns.map((col) => {

                        const val =
                          record[col];

                        const displayVal =
                          typeof val === "object"
                            ? JSON.stringify(val)
                            : String(
                              val ?? "—"
                            );

                        return (

                          <td
                            key={col}
                            className="px-3 py-2 text-slate-600 dark:text-slate-300 max-w-[200px] truncate"
                            title={displayVal}
                          >
                            {displayVal}
                          </td>

                        );

                      })}

                    </tr>

                  )
                )}

              </tbody>

            </table>

            {pageRecords.length === 0 &&
              !loading && (

                <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                  No history returned from API.
                </p>

              )}

          </div>

          {/* Pagination */}

          {history.length > 0 && (

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">

              <span className="text-slate-400 dark:text-slate-500">

                Showing{" "}
                {startIndex + 1}
                –
                {startIndex + pageRecords.length}
                {" "}of{" "}
                {history.length}

              </span>

              {totalPages > 1 && (

                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  onChange={setPage}
                />

              )}

            </div>

          )}

        </>

      )}

    </div>
  );
}