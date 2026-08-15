import { useBooking } from "../context/BookingContext";
import { EVENT_DATES, outletsForSelection } from "../data/outlets";

const TYPE_VENUE_LABEL = {
  parcel: "Delivery from",
  table: "Dine in venue",
  takeaway: "Takeaway venue",
};

export default function StepOutlet() {
  const { booking, update, goNext, goBack } = useBooking();
  const dateLabel = EVENT_DATES.find((d) => d.id === booking.date)?.label;
  const venues = outletsForSelection(booking.date, booking.orderType);

  function choose(outletId) {
    update({ outletId });
    goNext();
  }

  return (
    <div className="step-card">
      <div className="back-nav">
        <button className="btn-ghost" onClick={goBack}>← Back</button>
      </div>
      <h2 className="choice-card__title" style={{ fontSize: 20, marginBottom: 4 }}>
        {TYPE_VENUE_LABEL[booking.orderType] || "Which outlet"}, for {dateLabel}?
      </h2>
      <p className="field__hint" style={{ marginBottom: 18 }}>
        Same Sadhya, same menu at every outlet.
      </p>
      <div className="choice-grid">
        {venues.map((o) => (
          <button
            key={o.id}
            className={`choice-card ${booking.outletId === o.id ? "is-selected" : ""}`}
            onClick={() => choose(o.id)}
          >
            <div>
              <div className="choice-card__title">{o.name}</div>
              <div className="choice-card__meta">{o.area}</div>
            </div>
            <span className="choice-card__glyph" aria-hidden>📍</span>
          </button>
        ))}
      </div>
    </div>
  );
}
