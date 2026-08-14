// Pricing rules from the web app spec, §3.
export const SADHYA_PRICE = 999;
export const MAX_DELIVERY_KM = 10;
export const MAX_TABLE_PARTY_SIZE = 35;
export const TAKEAWAY_WINDOW_CAP = 15;
export const TABLE_SLOT_CAPACITY = 33; // midpoint of the 30–35 range
export const DAILY_ORDER_CAP = 800; // across all outlets combined

export function deliveryChargeForDistance(km) {
  if (km == null) return null;
  if (km > MAX_DELIVERY_KM) return null; // out of range — reject
  if (km <= 2) return 200;
  if (km <= 5) return 400;
  return 600; // 6–10 km
}

export function deliverySlabLabel(km) {
  if (km == null) return "";
  if (km > MAX_DELIVERY_KM) return "Beyond delivery range";
  if (km <= 2) return "0–2 km";
  if (km <= 5) return "2–5 km";
  return "6–10 km";
}

export function formatRupees(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function parcelTotal(quantity, deliveryCharge) {
  const itemTotal = quantity * SADHYA_PRICE;
  return itemTotal + (deliveryCharge || 0);
}

export function tableTotal(partySize) {
  return partySize * SADHYA_PRICE;
}

export function takeawayTotal(quantity) {
  return quantity * SADHYA_PRICE;
}
