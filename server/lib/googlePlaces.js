// Thin client for Google Places API (New).
// Docs: https://developers.google.com/maps/documentation/places/web-service/place-autocomplete
//       https://developers.google.com/maps/documentation/places/web-service/place-details
//
// Requires GOOGLE_PLACES_API_KEY to be set as an environment variable on
// the server (Render → Environment). Never expose this key to the browser
// — that's why these calls happen here on the backend, not in the React app.

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

function assertApiKey() {
  if (!API_KEY) {
    throw new Error(
      "GOOGLE_PLACES_API_KEY is not set. Add it in Render → Environment."
    );
  }
}

// Returns up to `limit` place predictions for the given free-text query,
// biased to India. `sessionToken` should be the same value for every
// keystroke in one "search session" (and for the follow-up placeDetails
// call) so Google bills it as a single session instead of per-request.
export async function autocomplete(query, { limit = 5, sessionToken } = {}) {
  assertApiKey();

  const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
    },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["in"],
      ...(sessionToken ? { sessionToken } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Places autocomplete HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const suggestions = data.suggestions || [];

  return suggestions
    .filter((s) => s.placePrediction)
    .slice(0, limit)
    .map((s) => {
      const p = s.placePrediction;
      const mainText = p.structuredFormat?.mainText?.text || p.text?.text || "";
      const secondaryText = p.structuredFormat?.secondaryText?.text || "";
      return {
        place_id: p.placeId,
        label: secondaryText ? `${mainText} — ${secondaryText}` : mainText,
        full_address: p.text?.text || mainText,
      };
    });
}

// Resolves a placeId (from autocomplete()) into lat/lon + postcode + a
// clean formatted address. Called once, when the user actually picks a
// suggestion — not on every keystroke.
export async function placeDetails(placeId, { sessionToken } = {}) {
  assertApiKey();

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);

  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "id,formattedAddress,location,addressComponents",
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Place details HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const postcodeComponent = (data.addressComponents || []).find((c) =>
    (c.types || []).includes("postal_code")
  );

  return {
    full_address: data.formattedAddress || "",
    lat: data.location?.latitude ?? null,
    lon: data.location?.longitude ?? null,
    postcode: postcodeComponent?.longText || "",
  };
}
