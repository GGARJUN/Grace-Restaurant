import { useState } from "react";
import { useBooking } from "../context/BookingContext";
import { OUTLETS, EVENT_DATES } from "../data/outlets";
import { formatRupees } from "../lib/pricing";
import { createOrder } from "../lib/api";
import { isRazorpayConfigured, openRazorpayCheckout } from "../lib/razorpay";

const TYPE_LABEL = { parcel: "Parcel", table: "Table", takeaway: "Takeaway" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StepCustomer() {
  const { booking, update, goNext, goBack } = useBooking();
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);

  const outlet = OUTLETS.find((o) => o.id === booking.outletId);
  const dateLabel = EVENT_DATES.find((d) => d.id === booking.date)?.label;

  function validate() {
    if (!booking.name.trim()) return "Please enter your name.";
    if (!/^\d{10}$/.test(booking.phone)) {
      return "Please enter a valid 10-digit phone number.";
    }
    if (!booking.email.trim()) return "Please enter your email address.";
    if (!EMAIL_PATTERN.test(booking.email.trim())) {
      return "Please enter a valid email address.";
    }
    return null;
  }

  // Keeps only digits as the user types, and caps length at 10 — so the
  // field can never hold letters/symbols and validate() never needs to
  // strip anything itself.
  function handlePhoneChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    update({ phone: digitsOnly });
  }

  async function handlePay() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setPaying(true);
    try {
      const result = await createOrder({
        date: booking.date,
        outlet_id: booking.outletId,
        order_type: booking.orderType,
        quantity: booking.orderType === "parcel" ? booking.quantity : booking.takeawayQuantity,
        party_size: booking.orderType === "table" ? booking.partySize : undefined,
        time_slot: booking.orderType === "table" ? booking.timeSlot : booking.pickupWindow,
        delivery_address: booking.orderType === "parcel" ? booking.address : undefined,
        distance_km: booking.orderType === "parcel" ? booking.distanceKm : undefined,
        total_amount: booking.totalAmount,
        customer_name: booking.name,
        customer_phone: booking.phone,
        customer_email: booking.email,
      });

      if (isRazorpayConfigured()) {
        // Opens the Razorpay checkout widget (spec §7). The webhook
        // (server/routes/payment.js) is the source of truth for marking
        // the order "paid" — this just moves the customer on to the
        // confirmation screen once they've completed payment.
        await openRazorpayCheckout({
          razorpayOrderId: result.razorpay_order_id,
          amount: result.amount,
          customer: { name: booking.name, phone: booking.phone, email: booking.email },
          description: `${TYPE_LABEL[booking.orderType]} — Onam Sadhya`,
        });
      }

      update({ orderId: result.order_id });
      goNext();
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="step-card">
      <div className="back-nav">
        <button className="btn-ghost" onClick={goBack}>← Back</button>
      </div>
      <h2 className="choice-card__title" style={{ fontSize: 20, marginBottom: 16 }}>
        Your details
      </h2>

      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label className="field__label">Name *</label>
        <input
          className="field__input"
          value={booking.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="field">
        <label className="field__label">Phone number *</label>
        <input
          className="field__input"
          value={booking.phone}
          onChange={handlePhoneChange}
          placeholder="10-digit mobile number"
          inputMode="numeric"
          pattern="\d*"
          maxLength={10}
          required
        />
      </div>

      <div className="field">
        <label className="field__label">Email *</label>
        <input
          className="field__input"
          value={booking.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="you@example.com"
          type="email"
          required
        />
      </div>

      <div className="summary">
        <div className="summary__row"><span>Outlet</span><span>{outlet?.name}</span></div>
        <div className="summary__row"><span>Date</span><span>{dateLabel}</span></div>
        <div className="summary__row"><span>Order</span><span>{TYPE_LABEL[booking.orderType]}</span></div>
        <div className="summary__row is-total">
          <span>Total to pay</span>
          <span className="amount">{formatRupees(booking.totalAmount || 0)}</span>
        </div>
      </div>

      <button type="button" className="btn btn-primary" onClick={handlePay} disabled={paying}>
        {paying ? "Processing…" : `Pay ${formatRupees(booking.totalAmount || 0)}`}
      </button>
    </div>
  );
}