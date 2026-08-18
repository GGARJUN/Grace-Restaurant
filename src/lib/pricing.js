// Pricing rules from the web app spec, §3.
// NOTE: the per-Sadhya rate is no longer a single fixed number — it varies
// by event date and order type (see EVENT_CONFIG in ../data/outlets.js).
// Use priceForSelection(date, orderType) to look it up, then pass that
// unit price into the *Total() helpers below.
export const MAX_DELIVERY_KM = 100;
export const MAX_TABLE_PARTY_SIZE = 35;
export const TAKEAWAY_WINDOW_CAP = 15;
export const TABLE_SLOT_CAPACITY = 33; // midpoint of the 30–35 range
export const DAILY_ORDER_CAP = 800; // across all outlets combined

// Delivery charge: ₹100 for the first 3 km, then +₹30 for every further
// 3 km bracket. e.g. up to 3 km → ₹100, 4–6 km → ₹130, 7–9 km → ₹160,
// 10–12 km → ₹190, and so on up to MAX_DELIVERY_KM.
const DELIVERY_BASE_CHARGE = 100;
const DELIVERY_STEP_CHARGE = 30;
const DELIVERY_STEP_KM = 3;

export function deliveryChargeForDistance(km) {
  if (km == null) return null;
  if (km > MAX_DELIVERY_KM) return null; // out of range — reject
  const bracket = Math.max(1, Math.ceil(km / DELIVERY_STEP_KM));
  return DELIVERY_BASE_CHARGE + DELIVERY_STEP_CHARGE * (bracket - 1);
}

export function deliverySlabLabel(km) {
  if (km == null) return "";
  if (km > MAX_DELIVERY_KM) return "Beyond delivery range";
  const bracket = Math.max(1, Math.ceil(km / DELIVERY_STEP_KM));
  if (bracket === 1) return `Up to ${DELIVERY_STEP_KM} km`;
  const lo = (bracket - 1) * DELIVERY_STEP_KM + 1;
  const hi = bracket * DELIVERY_STEP_KM;
  return `${lo}–${hi} km`;
}

export function formatRupees(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function parcelTotal(quantity, unitPrice, deliveryCharge) {
  const itemTotal = quantity * unitPrice;
  return itemTotal + (deliveryCharge || 0);
}

export function tableTotal(partySize, unitPrice) {
  return partySize * unitPrice;
}

export function takeawayTotal(quantity, unitPrice) {
  return quantity * unitPrice;
}
