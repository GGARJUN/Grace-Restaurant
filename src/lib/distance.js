// Client-side road-distance calculation using the Google Maps JavaScript
// API's DistanceMatrixService. This runs entirely in the browser — same
// API key + same HTTP-referrer-restricted key as the address autocomplete
// widget (src/components/AddressAutocomplete.jsx), no backend involved.
// DistanceMatrixService is part of the *core* Maps JavaScript API, so it's
// available as soon as loadGoogleMaps() resolves (no extra library needed).

import { loadGoogleMaps } from "./googleMapsLoader";
import { OUTLETS } from "../data/outlets";

// Mirrors what server/routes/distance.js used to return, so
// StepParcelDetails.jsx doesn't need to change: { distance_km }.
export async function calculateDistanceClientSide({ outletId, address, postcode, lat, lng }) {
  const outlet = OUTLETS.find((o) => o.id === outletId);
  if (!outlet) {
    throw new Error(`Unknown outlet: ${outletId}`);
  }

  const maps = await loadGoogleMaps();
  // As of Feb 2026, DistanceMatrixService is served through the "routes"
  // library rather than being globally available on window.google.maps —
  // Google's current docs recommend importLibrary("routes") explicitly.
  const { DistanceMatrixService } = await maps.importLibrary("routes");
  const service = new DistanceMatrixService();

  // Best case: exact coordinates from an autocomplete selection — no
  // geocoding ambiguity at all. Otherwise fall back to the typed address
  // text (+ postcode, if given, to help disambiguate).
  const destination =
    typeof lat === "number" && typeof lng === "number"
      ? new maps.LatLng(lat, lng)
      : postcode
      ? `${address}, ${postcode}, India`
      : `${address}, India`;

  const result = await new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [new maps.LatLng(outlet.lat, outlet.lng)],
        destinations: [destination],
        travelMode: maps.TravelMode.DRIVING,
        unitSystem: maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status !== "OK") {
          reject(new Error(`Distance Matrix status: ${status}`));
          return;
        }
        resolve(response);
      }
    );
  });

  const element = result.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    throw new Error(
      `Could not find a route to that address (${element?.status || "no result"}). ` +
        "Please check the spelling or add more detail (area, landmark)."
    );
  }

  const distanceKm = Math.round((element.distance.value / 1000) * 10) / 10; // metres → km, 1dp
  return { distance_km: distanceKm };
}
