import { useBooking } from "../context/BookingContext";
import QuantityStepper from "./QuantityStepper";
import { priceForSelection } from "../data/outlets";
import { MAX_TABLE_PARTY_SIZE, tableTotal, formatRupees } from "../lib/pricing";

export default function StepTableDetails() {
  const { booking, update, goNext, goBack } = useBooking();
  const unitPrice = priceForSelection(booking.date, "table");
  const total = tableTotal(booking.partySize, unitPrice);

  function handleContinue() {
    update({ totalAmount: total });
    goNext();
  }

  return (
    <div className="step-card">
      <div className="back-nav">
        <button className="btn-ghost" onClick={goBack}>← Back</button>
      </div>
      <h2 className="choice-card__title" style={{ fontSize: 20, marginBottom: 16 }}>
        Table — dine in
      </h2>

      <div className="field">
        <label className="field__label">Number of people</label>
        <QuantityStepper
          value={booking.partySize}
          onChange={(v) => update({ partySize: v })}
          max={MAX_TABLE_PARTY_SIZE}
          unitLabel={`${formatRupees(unitPrice)} per person`}
        />
      </div>

      <div className="summary">
        <div className="summary__row">
          <span>{booking.partySize} × {formatRupees(unitPrice)}</span>
          <span className="amount">{formatRupees(total)}</span>
        </div>
        <div className="summary__row is-total">
          <span>Total</span>
          <span className="amount">{formatRupees(total)}</span>
        </div>
        <p className="summary__note">Prepaid — this holds your table for the slot.</p>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
}
