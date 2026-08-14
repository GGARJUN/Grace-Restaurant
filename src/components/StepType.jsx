import { useBooking } from "../context/BookingContext";

const TYPES = [
  {
    id: "parcel",
    glyph: "🛵",
    title: "Parcel",
    meta: "Delivered to your home — ₹999 + delivery",
  },
  {
    id: "table",
    glyph: "🍽️",
    title: "Table",
    meta: "Dine in at the restaurant — ₹999 per person",
  },
  {
    id: "takeaway",
    glyph: "🥡",
    title: "Takeaway",
    meta: "Pick up from the outlet — ₹999",
  },
];

export default function StepType() {
  const { booking, update, goNext, goBack } = useBooking();

  function choose(orderType) {
    update({ orderType });
    goNext();
  }

  return (
    <div className="step-card">
      <div className="back-nav">
        <button className="btn-ghost" onClick={goBack}>← Back</button>
      </div>
      <h2 className="choice-card__title" style={{ fontSize: 20, marginBottom: 4 }}>
        What would you like?
      </h2>
      <p className="field__hint" style={{ marginBottom: 18 }}>
        One Sadhya is ₹999, however you take it.
      </p>
      <div className="choice-grid">
        {TYPES.map((t) => (
          <button
            key={t.id}
            className={`choice-card ${booking.orderType === t.id ? "is-selected" : ""}`}
            onClick={() => choose(t.id)}
          >
            <div>
              <div className="choice-card__title">{t.title}</div>
              <div className="choice-card__meta">{t.meta}</div>
            </div>
            <span className="choice-card__glyph" aria-hidden>{t.glyph}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
