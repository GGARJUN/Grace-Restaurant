// Loads the Google Maps JavaScript API (with the Places library) exactly
// once, no matter how many components ask for it — safe to call from
// multiple places, including React StrictMode's double-invoke in dev.
//
// Requires VITE_GOOGLE_MAPS_API_KEY to be set in the frontend .env file.
// Unlike a backend key, this one IS visible in the browser — that's normal
// for the Maps JavaScript API, but you MUST lock it down in Google Cloud
// Console → Credentials → your key → Application restrictions →
// "HTTP referrers" → add your domain(s) (e.g. your-app.vercel.app/*,
// localhost:5173/* for local dev). Without that restriction, anyone who
// copies the key from your page's network tab could use it on your bill.

let loadPromise = null;

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("loadGoogleMaps() can only run in the browser"));
      return;
    }

    // Already loaded (e.g. hot-reload during dev) — reuse it.
    if (window.google?.maps?.places) {
      resolve(window.google.maps);
      return;
    }

    if (!apiKey) {
      reject(
        new Error(
          "VITE_GOOGLE_MAPS_API_KEY is not set. Add it to the frontend .env file."
        )
      );
      return;
    }

    const script = document.createElement("script");
    // NOTE: deliberately NOT using "&loading=async" here. With that flag,
    // Google defers each library in `libraries=` (like "places") into a
    // separate async chunk that can still be loading when this <script>
    // tag's `onload` fires — leaving window.google.maps.places undefined
    // even though the script "loaded". Without the flag, the requested
    // libraries load synchronously as part of the same script, so they're
    // guaranteed ready by the time onload runs below.
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,routes`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load the Google Maps script"));
    script.onload = () => {
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }
      // Extra safety net: in rare cases there can be a few ms gap between
      // the script executing and `places` attaching. Poll briefly before
      // giving up.
      let attempts = 0;
      const poll = setInterval(() => {
        attempts += 1;
        if (window.google?.maps?.places) {
          clearInterval(poll);
          resolve(window.google.maps);
        } else if (attempts > 20) {
          clearInterval(poll);
          reject(new Error("Google Maps loaded but the Places library is missing"));
        }
      }, 100);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
