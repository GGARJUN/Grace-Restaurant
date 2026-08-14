import { Router } from "express";
import { nominatimFetch } from "../lib/nominatim.js";

const router = Router();

// GET /api/address-autocomplete?q=grace res
// Returns up to 5 nearby-matching place suggestions as the user types,
// like the Google Maps search box. Uses the same free OpenStreetMap
// Nominatim service as the distance calculator (server/routes/distance.js)
// — no API key required.
router.get("/", async (req, res) => {
  const query = (req.query.q || "").trim();

  // Don't hit the geocoder for very short input — avoids noisy/irrelevant
  // results and needless API calls while the user is still typing.
  if (query.length < 3) {
    return res.json({ suggestions: [] });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "in");

    const results = await nominatimFetch(url);

    const suggestions = results.map((r) => ({
      // Short, human-friendly label for the dropdown row (like Google's
      // bold place name + grey secondary line).
      label: shortLabel(r),
      full_address: r.display_name,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      postcode: r.address?.postcode || "",
    }));

    res.json({ suggestions });
  } catch (err) {
    console.error("Address autocomplete failed:", err.message);
    // Fail soft — an empty suggestion list just means no dropdown shows;
    // the user can still type the full address manually.
    res.json({ suggestions: [] });
  }
});

// Builds a "Place name — area, city" style short label from Nominatim's
// address breakdown, similar to how Google Maps trims long addresses in
// its autocomplete dropdown.
function shortLabel(result) {
  const a = result.address || {};
  const primary =
    a.amenity || a.shop || a.building || a.road || result.display_name.split(",")[0];
  const secondary = [a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  return secondary ? `${primary} — ${secondary}` : primary;
}

export default router;
