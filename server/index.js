// Grace Restaurant — Onam Sadhya Booking backend
//
// Implements every endpoint from the web app spec (§5). Google Maps and
// Razorpay are wired to the real APIs when their env vars are set (see
// server/.env.example), falling back to mocks otherwise. Still stubbed:
// a real database (server/store.js is in-memory) and capacity limits.

import "dotenv/config";
import express from "express";
import cors from "cors";
import outletsRouter from "./routes/outlets.js";
import distanceRouter from "./routes/distance.js";
import autocompleteRouter from "./routes/autocomplete.js";
import placeDetailsRouter from "./routes/place-details.js";
import ordersRouter from "./routes/orders.js";
import paymentRouter from "./routes/payment.js";

const app = express();
app.use(cors());
// Keep the raw request body around (in req.rawBody) alongside the parsed
// JSON — the Razorpay webhook signature (spec §7.2) must be computed over
// the exact raw bytes Razorpay sent, not a re-serialized version of it.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use("/api/outlets", outletsRouter);
app.use("/api/calculate-distance", distanceRouter);
app.use("/api/address-autocomplete", autocompleteRouter);
app.use("/api/place-details", placeDetailsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payment", paymentRouter);

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Grace booking backend listening on :${PORT}`);
});
