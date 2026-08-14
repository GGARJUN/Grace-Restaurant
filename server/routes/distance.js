import { Router } from "express";
import { OUTLETS } from "./outlets.js";
import { nominatimFetch } from "../lib/nominatim.js";

const router = Router();

const MAX_DELIVERY_KM = 10;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function deliveryChargeForDistance(km) {
  if (km > MAX_DELIVERY_KM) return null;
  if (km <= 2) return 200;
  if (km <= 5) return 400;
  return 600;
}

// POST /api/calculate-distance
// body: { outlet_id, delivery_address, postcode, lat?, lng? }
router.post("/", async (req, res) => {
  const { outlet_id, delivery_address, postcode, lat, lng } = req.body;

  if (!outlet_id || !delivery_address) {
    return res.status(400).json({ error: "outlet_id and delivery_address are required" });
  }

  const outlet = OUTLETS.find((o) => o.id === outlet_id);
  if (!outlet) {
    return res.status(400).json({ error: `Unknown outlet_id: ${outlet_id}` });
  }

  let distanceKm;
  try {
    const haveCoords = typeof lat === "number" && typeof lng === "number";

    if (haveCoords && GOOGLE_MAPS_API_KEY) {
      // Best case: exact coordinates AND a paid key — get real road
      // distance using the precise point, no geocoding ambiguity at all.
      distanceKm = await distanceViaGoogleMaps(outlet, `${lat},${lng}`, null);
    } else if (haveCoords) {
      // Exact coordinates but no Google key — straight-line distance is
      // exact (no geocoding step needed/possible to go wrong).
      distanceKm = haversineKm(outlet.lat, outlet.lng, lat, lng);
    } else if (GOOGLE_MAPS_API_KEY) {
      // No coordinates yet (address typed manually) — geocode via Google.
      distanceKm = await distanceViaGoogleMaps(outlet, delivery_address, postcode);
    } else {
      // No coordinates, no Google key — free geocoding fallback.
      distanceKm = await distanceViaNominatim(outlet, delivery_address, postcode);
    }
  } catch (err) {
    console.error("Distance calculation failed:", err.message);
    return res.status(502).json({ error: err.message || "Could not calculate distance for this address" });
  }

  const charge = deliveryChargeForDistance(distanceKm);
  if (charge == null) {
    return res.json({
      distance_km: distanceKm,
      delivery_slab: "beyond-range",
      delivery_charge: null,
      deliverable: false,
    });
  }

  res.json({
    distance_km: distanceKm,
    delivery_slab: distanceKm <= 2 ? "0-2 km" : distanceKm <= 5 ? "2-5 km" : "6-10 km",
    delivery_charge: charge,
    deliverable: true,
  });
});

// --- Option A: Google Maps Distance Matrix (road distance, needs paid key) ---
// Destination is the customer's typed address (with postcode appended, when
// given, to disambiguate). Origin is the outlet's full street address when
// we have one on file — letting Google geocode the exact building — falling
// back to its lat/lng only for outlets that don't have a confirmed address yet.
async function distanceViaGoogleMaps(outlet, address, postcode) {
  const destination = postcode ? `${address}, ${postcode}` : address;
  const origin = outlet.address || `${outlet.lat},${outlet.lng}`;
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("units", "metric");
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Maps API returned HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== "OK") {
    throw new Error(`Google Maps API status: ${data.status}`);
  }

  const element = data.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") {
    throw new Error(`Could not find a route to that address (${element?.status || "no result"})`);
  }

  return Math.round((element.distance.value / 1000) * 10) / 10; // meters -> km, 1dp
}

// --- Option B: OpenStreetMap Nominatim geocoding + Haversine (free, default) ---
// Straight-line ("as the crow flies") distance, not road distance. Good
// enough to bucket into delivery slabs without needing a billed API key.
async function distanceViaNominatim(outlet, address, postcode) {
  const query = postcode ? `${address}, ${postcode}, India` : `${address}, India`;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");

  const results = await nominatimFetch(url);
  if (!results.length) {
    throw new Error("Couldn't find that address. Please check the spelling or add more detail (area, landmark).");
  }

  const userLat = parseFloat(results[0].lat);
  const userLng = parseFloat(results[0].lon);

  return haversineKm(outlet.lat, outlet.lng, userLat, userLng);
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

export default router;
