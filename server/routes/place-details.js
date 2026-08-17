import { Router } from "express";
import { placeDetails } from "../lib/googlePlaces.js";

const router = Router();

// GET /api/place-details?place_id=ChIJ...&session=<uuid>
// Called once, when the user picks a suggestion from the autocomplete
// dropdown — resolves it into an exact lat/lon + postcode + formatted
// address so we can calculate delivery distance/charge accurately.
router.get("/", async (req, res) => {
  const placeId = (req.query.place_id || "").trim();
  const sessionToken = req.query.session || undefined;

  if (!placeId) {
    return res.status(400).json({ error: "place_id is required" });
  }

  try {
    const details = await placeDetails(placeId, { sessionToken });
    res.json(details);
  } catch (err) {
    console.error("Place details lookup failed:", err.message);
    res.status(502).json({ error: "Could not resolve that address. Please try again." });
  }
});

export default router;
