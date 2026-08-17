// Thin client for the backend endpoints defined in the spec (§5 / §7).
// Every function here should point at the real Express backend
// (see /server) once it's running — for now, calculate-distance
// falls back to a deterministic mock so the flow is fully clickable
// without a backend attached.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function postJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request to ${path} failed (${res.status})`);
  return res.json();
}

// POST /api/calculate-distance — { outlet_id, delivery_address, postcode, lat?, lng? }
// Passing lat/lng (e.g. from an autocomplete selection) skips geocoding
// entirely on the backend — more reliable than re-geocoding the full
// formatted address text.
export async function calculateDistance({ outletId, address, postcode, lat, lng }) {
  if (!BASE_URL) {
    // TODO(backend): remove this mock once VITE_API_BASE_URL points at
    // the real Express server, which calls the Google Maps Distance
    // Matrix API server-side (spec §8).
    return mockDistance(address);
  }
  return postJSON("/api/calculate-distance", {
    outlet_id: outletId,
    delivery_address: address,
    postcode,
    lat,
    lng,
  });
}

// GET /api/address-autocomplete?q=...&session=... — nearby place
// suggestions as the user types (Google Maps-style search dropdown).
// `sessionToken` should be the same value for every keystroke in one
// search, then passed once more to getPlaceDetails() when the user picks
// a result — that whole sequence is billed by Google as one session
// instead of per-request. Generate it with newSessionToken() below.
export async function autocompleteAddress(query, sessionToken) {
  if (!query || query.trim().length < 3) return [];

  if (!BASE_URL) {
    // TODO(backend): remove this mock once VITE_API_BASE_URL points at
    // the real Express server, which calls the Google Places API
    // server-side.
    return mockSuggestions(query);
  }

  const params = new URLSearchParams({ q: query });
  if (sessionToken) params.set("session", sessionToken);

  const res = await fetch(`${BASE_URL}/api/address-autocomplete?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}

// GET /api/place-details?place_id=...&session=... — resolves a picked
// suggestion (which only has a place_id, no coordinates yet) into an
// exact lat/lon + postcode + formatted address.
export async function getPlaceDetails(placeId, sessionToken) {
  if (!placeId) return null;

  if (!BASE_URL) {
    // TODO(backend): remove this mock once VITE_API_BASE_URL points at
    // the real Express server.
    return mockPlaceDetails(placeId);
  }

  const params = new URLSearchParams({ place_id: placeId });
  if (sessionToken) params.set("session", sessionToken);

  const res = await fetch(`${BASE_URL}/api/place-details?${params.toString()}`);
  if (!res.ok) return null;
  return res.json();
}

// Random ID for one autocomplete "session" (all keystrokes + the final
// place-details call). Call this once when the address field mounts /
// is cleared, and reuse it until the user picks a suggestion.
export function newSessionToken() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// POST /api/orders — creates the order record and a Razorpay order id
export async function createOrder(order) {
  if (!BASE_URL) {
    return {
      order_id: `GR${Math.floor(1000 + Math.random() * 9000)}`,
      razorpay_order_id: `order_mock_${Date.now()}`,
      amount: order.total_amount,
      status: "pending",
    };
  }
  return postJSON("/api/orders", order);
}

function mockSuggestions(query) {
  // Deterministic fake suggestions so the dropdown is exercised during
  // local UI development without a backend attached.
  const areas = ["Sector 3, Nerul East", "Sector 15, Nerul", "Sector 15, Kharghar", "Vashi", "Belapur"];
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          areas.slice(0, 3).map((area, i) => ({
            label: `${query} — ${area}`,
            full_address: `${query}, ${area}, Navi Mumbai, Maharashtra`,
            lat: 19.03 + i * 0.01,
            lon: 73.02 + i * 0.01,
            postcode: "",
          }))
        ),
      300
    )
  );
}

function mockPlaceDetails(placeId) {
  // Deterministic fake coordinates so the flow is exercised consistently
  // during local UI development without a backend attached.
  const hash = Array.from(placeId || "").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          full_address: "Mock resolved address, Navi Mumbai, Maharashtra",
          lat: 19.03 + (hash % 10) * 0.01,
          lon: 73.02 + (hash % 10) * 0.01,
          postcode: "400614",
        }),
      200
    )
  );
}

function mockDistance(address) {
  // Deterministic pseudo-distance from the address string so the UI
  // is exercised consistently during local development.
  const hash = Array.from(address || "").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const km = Math.round(((hash % 130) / 10 + 0.5) * 10) / 10; // 0.5–13.5 km
  return new Promise((resolve) => setTimeout(() => resolve({ distance_km: km }), 700));
}
