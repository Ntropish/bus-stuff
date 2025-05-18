import { create } from "zustand";
import { type Route, routesData } from "./routes";
import { keyBy } from "lodash-es";

interface DataStore {
  routes: Route[]; // The original array of routes
  routesById: Record<string, Route>; // Lookup structure: route_id -> Route object
  routesError: string | null; // To store any initial loading/processing errors
}

// Initialize the store
export const useDataStore = create<DataStore>()((set) => {
  let initialError: string | null = null;

  // Check for errors from the data loading/processing step
  if (!routesData || !routesData.success) {
    initialError =
      "Failed to load or process routes data. Check console for details.";
    console.error("Error details from routesData:", routesData?.errors);
  } else if (routesData.errors && routesData.errors.length > 0) {
    console.warn(
      "Some routes had validation issues during load. These records might be missing:",
      routesData.errors
    );
  }

  const currentRoutes = routesData?.data || []; // Fallback to empty array

  return {
    routes: currentRoutes,
    // Use Lodash's keyBy to create the lookup table.
    // The second argument to keyBy is the property to use as the key.
    routesById: keyBy(currentRoutes, "route_id"),
    routesError: initialError,
  };
});
