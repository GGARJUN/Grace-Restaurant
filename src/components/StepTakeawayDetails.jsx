import { useBooking } from "../context/BookingContext";
import QuantityStepper from "./QuantityStepper";
import { priceForSelection } from "../data/outlets";
import { takeawayTotal, formatRupees } from "../lib/pricing";

export default function StepTakeawayDetails() {
  const { booking, update, goNext, goBack } = useBooking();
  const unitPrice = priceForSelection(booking.date, "takeaway");
  const total = takeawayTotal(booking.takeawayQuantity, unitPrice);

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
        Takeaway — pickup from outlet
      </h2>

      <div className="field">
        <label className="field__label">How many Sadhya?</label>
        <QuantityStepper
          value={booking.takeawayQuantity}
          onChange={(v) => update({ takeawayQuantity: v })}
          unitLabel={`${formatRupees(unitPrice)} each`}
        />
      </div>

      <div className="summary">
        <div className="summary__row">
          <span>{booking.takeawayQuantity} × {formatRupees(unitPrice)}</span>
          <span className="amount">{formatRupees(total)}</span>
        </div>
        <div className="summary__row is-total">
          <span>Total</span>
          <span className="amount">{formatRupees(total)}</span>
        </div>
        <p className="summary__note">No delivery charge — collect it yourself.</p>
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
