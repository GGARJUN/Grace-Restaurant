import { Router } from "express";
import Razorpay from "razorpay";
import { ORDERS, nextOrderId } from "../store.js";

const router = Router();

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

// POST /api/orders
router.post("/", async (req, res) => {
  const body = req.body;

  if (!body.date || !body.outlet_id || !body.order_type || !body.total_amount) {
    return res.status(400).json({ error: "Missing required order fields" });
  }

  // TODO(capacity): enforce the caps from spec §4 here before accepting —
  // 800 orders/day across all outlets, ~33 seats per table slot, 15
  // takeaway orders per pickup window. Reject with a clear message
  // ("this slot is full") rather than silently overbooking.

  const orderId = nextOrderId();

  let razorpayOrderId;
  if (razorpay) {
    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(body.total_amount * 100), // paise
        currency: "INR",
        receipt: orderId,
        notes: { order_id: orderId, outlet_id: body.outlet_id, order_type: body.order_type },
      });
      razorpayOrderId = razorpayOrder.id;
    } catch (err) {
      console.error("Razorpay order creation failed:", err.message);
      return res.status(502).json({ error: "Could not start payment. Please try again." });
    }
  } else {
    razorpayOrderId = `order_mock_${Date.now()}`;
  }

  const order = {
    order_id: orderId,
    razorpay_order_id: razorpayOrderId,
    ...body,
    payment_status: "pending",
    created_at: new Date().toISOString(),
  };
  ORDERS.set(orderId, order);

  res.json({ order_id: orderId, razorpay_order_id: razorpayOrderId, amount: body.total_amount, status: "pending" });
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = ORDERS.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// GET /api/admin/orders — TODO(auth): protect this with the admin login from spec §6.
router.get("/", (_req, res) => {
  res.json(Array.from(ORDERS.values()));
});

export default router;
