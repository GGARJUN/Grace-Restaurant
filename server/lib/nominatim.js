// Shared Nominatim client used by both server/routes/autocomplete.js and
// server/routes/distance.js.
//
// Why this exists: Nominatim's usage policy allows at most 1 request/second
// per IP, and free hosts like Render route outbound traffic through a
// shared IP used by many other apps at once — so even light, well-behaved
// traffic from this app can get HTTP 429s that have nothing to do with how
// fast *our* users are typing. This module fixes that by:
//   1. Queueing every outbound call so they're spaced >=1.1s apart, no
//      matter how many requests come in from different users at once.
//   2. Retrying once (with backoff, honoring Retry-After when present) if
//      Nominatim still returns 429.
//   3. Caching results for a few minutes so repeated/identical lookups
//      (e.g. re-rendered debounce calls, popular addresses) don't hit the
//      network again at all.

const MIN_INTERVAL_MS = 1100; // stay just under Nominatim's 1 req/sec cap
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const USER_AGENT = "GraceRestaurant-OnamSadhya/1.0 (booking app; contact: grace-restaurant support)";

const cache = new Map(); // url string -> { data, expiresAt }
let queue = Promise.resolve();
let lastRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  // Simple cleanup so the cache doesn't grow unbounded on a long-lived
  // Render instance.
  if (cache.size > 500) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

async function throttledFetch(url) {
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - now);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  return fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
}

async function fetchWithRetry(url) {
  let response = await throttledFetch(url);

  if (response.status === 429) {
    const retryAfterHeader = Number(response.headers.get("retry-after"));
    const backoffMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : 2000;
    await sleep(backoffMs);
    response = await throttledFetch(url);
  }

  return response;
}

// Runs `task` (an async function that performs one Nominatim call) after
// every previously-queued task has finished, so calls from concurrent
// requests never overlap. Returns whatever `task` resolves to.
function enqueue(task) {
  const run = queue.then(task, task);
  // Swallow errors here so one failed request doesn't stall the queue for
  // everyone after it — the real error still propagates to the caller
  // via the returned promise below.
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

// Fetches `url` (a Nominatim endpoint, as a URL object or string) through
// the shared cache + throttle + retry pipeline, and returns the parsed
// JSON body. Throws with a clear message if the request ultimately fails.
export async function nominatimFetch(url) {
  const key = url.toString();

  const cached = getCached(key);
  if (cached !== undefined) return cached;

  const response = await enqueue(() => fetchWithRetry(url));

  if (!response.ok) {
    throw new Error(`Geocoding service returned HTTP ${response.status}`);
  }

  const data = await response.json();
  setCached(key, data);
  return data;
}
