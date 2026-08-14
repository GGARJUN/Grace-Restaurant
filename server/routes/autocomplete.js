import { Router } from "express";
import { photonAutocomplete } from "../lib/photon.js";

const router = Router();

// GET /api/address-autocomplete?q=grace res
// Returns up to 5 nearby-matching place suggestions as the user types,
// like the Google Maps search box. Uses Photon (server/lib/photon.js),
// a free OpenStreetMap-based geocoder built for autocomplete/typeahead
// traffic — no API key required. (The distance calculator in
// server/routes/distance.js uses Nominatim instead, since a one-off
// per-order lookup is exactly the low-frequency traffic Nominatim's
// stricter per-IP policy is fine with.)
router.get("/", async (req, res) => {
  const query = (req.query.q || "").trim();

  // Don't hit the geocoder for very short input — avoids noisy/irrelevant
  // results and needless API calls while the user is still typing.
  if (query.length < 3) {
    return res.json({ suggestions: [] });
  }

  try {
    const suggestions = await photonAutocomplete(query, 5);
    res.json({ suggestions });
  } catch (err) {
    console.error("Address autocomplete failed:", err.message);
    // Fail soft — an empty suggestion list just means no dropdown shows;
    // the user can still type the full address manually.
    res.json({ suggestions: [] });
  }
});

export default router;
