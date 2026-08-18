// Thin client for the order/payment backend endpoints (§5 / §7). Address
// autocomplete (src/components/AddressAutocomplete.jsx) and delivery
// distance (src/lib/distance.js) now run entirely client-side against
// Google Maps directly — no backend involved for those. Order creation and
// Razorpay payment still go through the Express server in /server, since
// the Razorpay secret key must never be exposed in the browser.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function postJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request to ${path} failed (${res.status})`);
  return res.json();
}

// POST /api/orders — creates the order record and a Razorpay order id
export async function createOrder(order) {
  if (!BASE_URL) {
    return {
      order_id: `GR${Math.floor(1000 + Math.random() * 9000)}`,
      razorpay_order_id: `order_mock_${Date.now()}`,
      amount: order.total_amount,
      status: "pending",
    };
  }
  return postJSON("/api/orders", order);
}
