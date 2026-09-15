
import { useState } from "react";
import PlateSearch from "./anpr/search";
import Details from "./anpr/details";
import Map from "./anpr/map";
import { getVehicleByPlate } from "../api/endpoints/vehicles";

const INITIAL_PLATE = "";

const Anpr = () => {
  // 1. Tracks what the user is currently typing in the text box
  const [plateInput, setPlateInput] = useState(INITIAL_PLATE);
  
  // 2. Tracks the final searched plate to pass to the Map and Details components
  const [activePlate, setActivePlate] = useState(INITIAL_PLATE);

  // 3. This function handles the API request when "Enter" or "Search" is pressed
  const sendSearchToBackend = async (plateNumber: string, activeTab: string) => {
    if (!plateNumber) return; 

    // Tell the Map and Details components to update with the new plate number
    // This automatically triggers them to fetch the updated data from backend.
    // 
    // This will implicitly trigger the following API requests in the child components:
    // 1. Details: GET {VITE_API_BASE_URL}/vehicles/{plateNumber} 
    // 2. Map:     GET {VITE_API_BASE_URL}/vehicles/{plateNumber}/trajectory
    setActivePlate(plateNumber);

    try {
      // This is the exact code to connect to your backend using your app's built-in API client.
      // EXACT API CALL SENT TO BACKEND:
      // GET {VITE_API_BASE_URL}/vehicles/{plateNumber}
      // Example: GET /api/vehicles/WB02AM7555
      // EXACT API REQUEST SENT BY FRONTEND TO BACKEND:
      //
      // Method: GET
      // URL: {VITE_API_BASE_URL}/vehicles/{plateNumber} 
      // (Example: GET /api/vehicles/WB02AM7555)
      //
      // Headers:
      // - Content-Type: application/json
      // - Authorization: Bearer <your-token> (if VITE_AUTH_ENABLED=true)
      //
      // Body (Payload): 
      // NONE. (This is a GET request, so the plate number is passed directly in the URL path, not in a JSON body).
      //
      //Method: GET
      // URL: {VITE_API_BASE_URL}/vehicles/WB02AM7555

      // Headers:
      // - Content-Type: application/json
      // - Authorization: Bearer <your-token> 

      // Body (Payload): 
      // NONE. (This is a GET request, so the plate number is passed directly in the URL path)

      // Note: By default the app runs in 'mock' mode. To hit your real backend, 
      // ensure you have VITE_DATA_SOURCE=backend in your .env file!
      const data = await getVehicleByPlate(plateNumber);
      console.log("Success! Backend responded with:", data);
    } catch (error) {
      console.error("Failed to connect to backend:", error);
    }
  };

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
        {/* The updated PlateSearch component handles the UI and triggers onSearch */}
        <PlateSearch 
          value={plateInput} 
          onChange={setPlateInput} 
          onSearch={sendSearchToBackend} 
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="flex min-w-0 w-full flex-col lg:flex-1">
          {/* We pass activePlate here so it only updates after hitting Search */}
          <Details plate={activePlate} />
        </div>
        <div className="flex min-w-0 w-full flex-col lg:flex-1">
          <Map plate={activePlate} />
        </div>
      </div>
    </div>
  );
};

export default Anpr;