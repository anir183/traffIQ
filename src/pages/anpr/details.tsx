export default function VehicleInformation() {
  const rows = [
    { label: "Plate Number", value: "WB02AM7555" },
    { label: "Vehicle Type", value: "Car 🚗" },
    { label: "Make / Model", value: "Maruti Swift" },
    { label: "First Seen", value: "06 Sep 2026, 14:30:02" },
    { label: "Last Seen", value: "06 Sep 2026, 14:47:56" },
    { label: "Total Detections", value: "3" },
  ];

  return (
    <div className="w-[50%] h-[362px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-center! items-center!">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Vehicle Information
      </h3>

      <div className="flex gap-4">
        {/* <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-50">
          <span className="text-2xl"></span>
        </div> */}

        <div className="flex-1">
          <dl className="space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="flex text-xl">
                <dt className="w-32 flex-shrink-0 text-gray-500">
                  {row.label}
                </dt>
                <dd className="text-gray-800">{row.value}</dd>
              </div>
            ))}
            <div className="flex items-center text-sm">
              <dt className="w-32 flex-shrink-0 text-gray-500">Status</dt>
              <dd>
                <span className="inline-block rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
                  Normal
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}