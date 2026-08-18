// TODO(backend): replace with a GET /api/outlets call — this should
// mirror server/routes/outlets.js exactly.
export const OUTLETS = [
  {
    id: "grace-nerul",
    name: "Grace Restaurant Nerul",
    area: "Sector 3, Nerul East (Navi Mumbai)",
    lat: 19.0330,
    lng: 73.0190,
  },
  {
    id: "grace-kharghar",
    name: "Grace Restaurant Kharghar",
    area: "Sector 15, Kharghar (Navi Mumbai)",
    lat: 19.0474,
    lng: 73.0669,
  },
  {
    id: "achayans-kitchen",
    name: "Achayan's Kitchen",
    area: "Sector 15, Nerul (Navi Mumbai)",
    lat: 19.0350,
    lng: 73.0155,
  },
  {
    id: "eternal-hall",
    name: "Eternal Hall",
    area: "Hope Charity Mission Hall, Sector 5, Nerul (Navi Mumbai)",
    lat: 19.0280,
    lng: 73.0175,
  },
];

// Fixed for this one-time Onam event.
export const EVENT_DATES = [
  { id: "2026-08-25", label: "25 August" },
  { id: "2026-08-26", label: "26 August" },
];

// Which venues are offered for each order type, per date — and what the
// per-Sadhya rate is that day. "Delivery From" (parcel) can differ from
// the Dine In / Takeaway venue list, since not every hall used for dine-in
// events is a kitchen that can dispatch deliveries.
export const EVENT_CONFIG = {
  "2026-08-25": {
    prices: { table: 700, takeaway: 775, parcel: 775 },
    outletsByType: {
      table: ["grace-nerul", "grace-kharghar", "achayans-kitchen"],
      takeaway: ["grace-nerul", "grace-kharghar", "achayans-kitchen"],
      parcel: ["grace-nerul", "grace-kharghar", "achayans-kitchen"],
    },
  },
  "2026-08-26": {
    prices: { table: 800, takeaway: 875, parcel: 875 },
    outletsByType: {
      table: ["eternal-hall", "grace-kharghar"],
      takeaway: ["eternal-hall", "grace-kharghar"],
      parcel: ["grace-nerul", "grace-kharghar"],
    },
  },
};

// Outlets to show in the outlet-picker for a given date + order type.
export function outletsForSelection(dateId, orderType) {
  const ids = EVENT_CONFIG[dateId]?.outletsByType?.[orderType] || [];
  return OUTLETS.filter((o) => ids.includes(o.id));
}

// Per-Sadhya rate for a given date + order type (before delivery charge,
// for parcel orders — that's added separately based on distance).
export function priceForSelection(dateId, orderType) {
  return EVENT_CONFIG[dateId]?.prices?.[orderType] ?? null;
}
