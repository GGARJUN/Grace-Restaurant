import { Router } from "express";
import { autocomplete } from "../lib/googlePlaces.js";

const router = Router();

// GET /api/address-autocomplete?q=grace res&session=<uuid>
// Returns up to 5 nearby-matching place suggestions as the user types,
// exactly like the Google Maps search box — because it IS the same
// underlying data (Google Places API). `session` should be a random ID
// generated once per address field (see src/lib/api.js) and reused for
// every keystroke + the final place-details call, so Google bills the
// whole search as one session instead of charging per request.
router.get("/", async (req, res) => {
  const query = (req.query.q || "").trim();
  const sessionToken = req.query.session || undefined;

  // Don't hit the API for very short input — avoids noisy/irrelevant
  // results and needless (billable) calls while the user is still typing.
  if (query.length < 3) {
    return res.json({ suggestions: [] });
  }

  try {
    const suggestions = await autocomplete(query, { limit: 5, sessionToken });
    res.json({ suggestions });
  } catch (err) {
    console.error("Address autocomplete failed:", err.message);
    // Fail soft — an empty suggestion list just means no dropdown shows;
    // the user can still type the full address manually.
    res.json({ suggestions: [] });
  }
});

export default router;
