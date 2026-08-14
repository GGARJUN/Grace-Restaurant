// Photon (https://photon.komoot.io) — a free, no-API-key geocoder built on
// top of the same OpenStreetMap data as Nominatim, but run by Komoot as a
// separate service purpose-built for autocomplete/typeahead traffic.
//
// Why not just Nominatim for this: Nominatim's public instance enforces a
// strict 1 req/sec-per-IP policy and, once an IP trips it, can keep
// rejecting that IP for a while — which is exactly what was happening here,
// since Render's free-tier outbound IP is shared with many other apps and
// gets flagged regardless of how carefully *this* app throttles its own
// requests. Photon is meant for exactly this per-keystroke use case and
// doesn't share Nominatim's IP-block history, so it's a better fit for
// autocomplete specifically. server/routes/distance.js keeps using the
// throttled Nominatim client (server/lib/nominatim.js) since it's a single
// low-frequency call per order, not per keystroke.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const USER_AGENT = "GraceRestaurant-OnamSadhya/1.0 (booking app; address autocomplete)";

// Rough bounding box for India (west, south, east, north) — biases/limits
// results to the region this app serves, similar to Nominatim's
// countrycodes=in.
const INDIA_BBOX = "68.0,6.0,97.5,36.0";

const cache = new Map(); // url string -> { data, expiresAt }

function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.data;
}

function setCached(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

// Fetches suggestions for `query` from Photon and returns them already
// normalized to the same shape server/routes/autocomplete.js used to build
// from Nominatim: { label, full_address, lat, lon, postcode }.
export async function photonAutocomplete(query, limit = 5) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("lang", "en");
  url.searchParams.set("bbox", INDIA_BBOX);

  const key = url.toString();
  const cached = getCached(key);
  if (cached !== undefined) return cached;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Geocoding service returned HTTP ${response.status}`);
  }

  const geojson = await response.json();
  const suggestions = (geojson.features || []).map(featureToSuggestion);

  setCached(key, suggestions);
  return suggestions;
}

// Photon returns GeoJSON features; build the same "Place — area, city"
// short label style the app previously built from Nominatim's response.
function featureToSuggestion(feature) {
  const p = feature.properties || {};
  const [lon, lat] = feature.geometry?.coordinates || [];

  const primary = p.name || p.street || p.district || "Unnamed place";
  const secondary = [p.district || p.suburb, p.city || p.county, p.state]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  const label = secondary ? `${primary} — ${secondary}` : primary;

  const fullAddressParts = [
    p.name,
    p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street,
    p.district || p.suburb,
    p.city || p.county,
    p.state,
    p.postcode,
    p.country,
  ].filter(Boolean);

  return {
    label,
    full_address: [...new Set(fullAddressParts)].join(", "),
    lat: typeof lat === "number" ? lat : null,
    lon: typeof lon === "number" ? lon : null,
    postcode: p.postcode || "",
  };
}
