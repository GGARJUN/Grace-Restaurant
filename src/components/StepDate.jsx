import { useBooking } from "../context/BookingContext";
import { EVENT_DATES } from "../data/outlets";

export default function StepDate() {
  const { booking, update, goNext } = useBooking();

  function choose(dateId) {
    update({ date: dateId });
    goNext();
  }

  return (
    <div className="step-card">
      <h2 className="choice-card__title" style={{ fontSize: 20, marginBottom: 4 }}>
        When would you like your Sadhya?
      </h2>
      <p className="field__hint" style={{ marginBottom: 18 }}>
        Onam Sadhya booking is open for three dates only.
      </p>
      <div className="choice-grid">
        {EVENT_DATES.map((d) => (
          <button
            key={d.id}
            className={`choice-card ${booking.date === d.id ? "is-selected" : ""}`}
            onClick={() => choose(d.id)}
          >
            <div>
              <div className="choice-card__title">{d.label}</div>
              <div className="choice-card__meta">Onam Sadhya, all outlets</div>
            </div>
            <span className="choice-card__glyph" aria-hidden>🌼</span>
          </button>
        ))}
      </div>
    </div>
  );
}
