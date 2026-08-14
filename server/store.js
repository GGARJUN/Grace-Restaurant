// TODO(db): replace with the real Orders table from spec §6. In-memory
// here, shared between routes/orders.js and routes/payment.js, purely so
// the flow is exercisable end-to-end during development.

export const ORDERS = new Map();

let counter = 1;

export function nextOrderId() {
  return `GR${String(counter++).padStart(4, "0")}`;
}
