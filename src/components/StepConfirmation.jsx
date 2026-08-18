import { useBooking } from "../context/BookingContext";
import { OUTLETS, EVENT_DATES } from "../data/outlets";
import { formatRupees } from "../lib/pricing";

const TYPE_LABEL = { parcel: "Parcel delivery", table: "Table booking", takeaway: "Takeaway pickup" };
const TYPE_NOTE = {
  parcel: "Grace's team will contact you to coordinate delivery.",
  table: "See you at the restaurant on the day.",
  takeaway: "We'll message you on WhatsApp when it's ready for pickup.",
};

export default function StepConfirmation() {
  const { booking, reset } = useBooking();
  const outlet = OUTLETS.find((o) => o.id === booking.outletId);
  const dateLabel = EVENT_DATES.find((d) => d.id === booking.date)?.label;
  const detail =
    booking.orderType === "parcel"
      ? `${booking.quantity} × Sadhya to ${booking.address}`
      : booking.orderType === "table"
      ? `${booking.partySize} people`
      : `${booking.takeawayQuantity} × Sadhya`;

  return (
    <div className="step-card">
      <div className="ticket">
        <div className="ticket__check" aria-hidden>✓</div>
        <div className="ticket__id">Order {booking.orderId}</div>
        <div className="ticket__title">Booking confirmed</div>

        <div className="ticket__row"><span>Outlet</span><span>{outlet?.name}</span></div>
        <div className="ticket__row"><span>Date</span><span>{dateLabel}</span></div>
        <div className="ticket__row"><span>Order type</span><span>{TYPE_LABEL[booking.orderType]}</span></div>
        <div className="ticket__row"><span>Details</span><span>{detail}</span></div>
        <div className="ticket__row"><span>Total paid</span><span>{formatRupees(booking.totalAmount || 0)}</span></div>

        <p className="field__hint" style={{ textAlign: "center", marginTop: 16 }}>
          {TYPE_NOTE[booking.orderType]}
        </p>
      </div>

      <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={reset}>
        Start a new booking
      </button>
    </div>
  );
}
