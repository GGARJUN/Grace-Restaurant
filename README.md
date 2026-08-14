# Grace Restaurant — Onam Sadhya Booking (skeleton)

A working front-end skeleton of the booking flow described in the spec,
plus a stubbed backend with every endpoint the frontend calls. This is
a starting point for Emergent Labs (or Claude Code) to build on — the
flow, pricing rules, and structure are real; the integrations
(Google Maps, Razorpay, WhatsApp, a real database) are marked with
`TODO` comments where they plug in.

## What's here

```
src/
  data/outlets.js       Outlets, event dates, time slots, pickup windows
  lib/pricing.js         Pricing & delivery-slab rules from the spec
  lib/api.js              Client calls to the backend (mocked until VITE_API_BASE_URL is set)
  context/BookingContext.jsx   Flow state across all steps
  components/            One component per step (date → outlet → order type →
                          details → your info → confirmation)
  App.jsx                 Wires the steps together
  index.css               Design tokens + all styling (no CSS framework)

server/
  index.js                Express app
  routes/outlets.js        GET /api/outlets
  routes/distance.js       POST /api/calculate-distance  (Google Maps goes here)
  routes/orders.js         POST /api/orders, GET /api/orders/:id (Razorpay + DB go here)
  routes/payment.js        POST /api/payment/razorpay-webhook
```

## Running it

Frontend:
```
npm install
npm run dev
```
Without a backend running, distance calculation and order creation use
built-in mocks (see `src/lib/api.js`) so the whole flow — including
the delivery-charge calculation — is clickable end to end.

Backend (optional, for wiring real integrations):
```
cd server
npm install
npm run dev
```
Then set `VITE_API_BASE_URL=http://localhost:4000` in a `.env` file at
the project root so the frontend talks to the real server instead of
the mock.

### Environment variables

Copy `.env.example` → `.env` at the project root, and `server/.env.example`
→ `server/.env`, then fill in:

- `GOOGLE_MAPS_API_KEY` (server) — enables real Distance Matrix calls in
  `server/routes/distance.js`. Unset, it falls back to a deterministic
  mock distance.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (server) — enables real order
  creation in `server/routes/orders.js`. Unset, it falls back to mock
  order ids.
- `RAZORPAY_WEBHOOK_SECRET` (server) — used to verify the webhook
  signature in `server/routes/payment.js`. Configure the same secret in
  the Razorpay dashboard's webhook settings, pointed at
  `{backend_url}/api/payment/razorpay-webhook`, subscribed to
  `payment.captured` and `payment.failed`.
- `VITE_RAZORPAY_KEY_ID` (frontend) — the same Razorpay Key Id, used to
  open the checkout widget client-side. Unset, the flow skips straight
  to confirmation (mock mode, matching current dev-without-backend
  behavior).

## What's real vs. stubbed

**Real:**
- The full 6-step flow (date → outlet → order type → details → your
  info → confirmation) for all three order types
- Pricing, delivery slabs, max distance (10 km), party size cap, and
  the review-before-pay step from the spec
- Google Maps Distance Matrix calls (`server/routes/distance.js`),
  falling back to a mock distance when no API key is configured
- Razorpay order creation, checkout widget, and webhook signature
  verification (`server/routes/orders.js`, `server/routes/payment.js`,
  `src/lib/razorpay.js`), falling back to mock order ids/skipping the
  widget when no keys are configured
- Component structure clean enough to extend (add capacity checks,
  swap the in-memory store for a real database, etc.)

**Stubbed — needs a real integration:**
- A real database (everything is in-memory in `server/store.js`)
- Per-slot / per-day capacity enforcement (spec §4) — currently
  accepts any order
- WhatsApp notifications to customer + Grace's team (see the separate
  WhatsApp bot spec) — the webhook has a TODO marking where to trigger
  these once an order is marked paid
- Admin dashboard (spec §6) — not built yet; the backend already
  exposes `GET /api/orders` to list everything as a starting point

## Design notes

Palette and motifs are drawn from Onam itself rather than a generic
template: the kasavu mundu's gold-on-cream border (the top accent bar
and the confirmation ticket's dashed edge), banana-leaf green, and a
small pookalam-style ring used only for the one loading moment
(distance calculation). Fonts: Fraunces for headings, Inter for body
text, IBM Plex Mono for prices and the order ID.
