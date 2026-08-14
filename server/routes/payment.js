import { Router } from "express";
import crypto from "node:crypto";
import { ORDERS } from "../store.js";

const router = Router();

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

function isValidSignature(rawBody, signature) {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  return expectedBuf.length === signatureBuf.length && crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

function findOrderByRazorpayOrderId(razorpayOrderId) {
  for (const order of ORDERS.values()) {
    if (order.razorpay_order_id === razorpayOrderId) return order;
  }
  return null;
}

// POST /api/payment/razorpay-webhook
router.post("/razorpay-webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!isValidSignature(req.rawBody, signature)) {
    console.error("Razorpay webhook signature verification failed");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body;
  const paymentEntity = event?.payload?.payment?.entity;

  if (event.event === "payment.captured" && paymentEntity) {
    const order = findOrderByRazorpayOrderId(paymentEntity.order_id);
    if (order) {
      order.payment_status = "paid";
      order.payment_id = paymentEntity.id;
      order.updated_at = new Date().toISOString();

      // TODO(whatsapp): send the customer confirmation message and the
      // Grace team ops alert here (see WhatsApp bot spec §4.2 / §4.3).
    } else {
      console.error(`Webhook payment.captured for unknown order ${paymentEntity.order_id}`);
    }
  } else if (event.event === "payment.failed" && paymentEntity) {
    const order = findOrderByRazorpayOrderId(paymentEntity.order_id);
    if (order) {
      order.payment_status = "failed";
      order.updated_at = new Date().toISOString();
    }
  }

  res.json({ received: true });
});

export default router;
