// TODO(backend): replace with a GET /api/outlets call — this should
// mirror server/routes/outlets.js exactly.
export const OUTLETS = [
  {
    id: "grace-nerul",
    name: "Grace Nerul",
    area: "Sector 3, Nerul East, Navi Mumbai",
    lat: 19.0330,
    lng: 73.0190,
  },
  {
    id: "achayans-nerul",
    name: "Achayans Nerul",
    area: "Sector 15, Nerul, Navi Mumbai",
    lat: 19.0350,
    lng: 73.0155,
  },
  {
    id: "grace-kharghar",
    name: "Grace Kharghar",
    area: "Sector 15, Kharghar, Navi Mumbai",
    lat: 19.0474,
    lng: 73.0669,
  },
];

// Fixed for this one-time Onam event — see proposal §4/§13.
export const EVENT_DATES = [
  { id: "2026-08-24", label: "24 August" },
  { id: "2026-08-25", label: "25 August" },
  { id: "2026-08-26", label: "26 August" },
];

export const TIME_SLOTS = [
  "12:00 PM – 1:00 PM",
  "1:00 PM – 2:00 PM",
  "2:00 PM – 3:00 PM",
  "3:00 PM – 4:00 PM",
  "4:00 PM – 5:00 PM",
  "5:00 PM – 6:00 PM",
  "6:00 PM – 7:00 PM",
  "7:00 PM – 8:00 PM",
  "8:00 PM – 9:00 PM",
  "9:00 PM – 10:00 PM",
  "10:00 PM – 11:00 PM",
];

// 30-minute takeaway pickup windows, 15 orders cap per window (spec §4).
export const PICKUP_WINDOWS = (() => {
  const windows = [];
  let h = 12, m = 0;
  while (h < 23) {
    const start = formatClock(h, m);
    m += 30;
    if (m >= 60) { m -= 60; h += 1; }
    const end = formatClock(h, m);
    windows.push(`${start} – ${end}`);
  }
  return windows;
})();

function formatClock(h, m) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${m === 0 ? "00" : m} ${period}`;
}
