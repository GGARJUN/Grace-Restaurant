import { useState } from "react";
import { useBooking } from "../context/BookingContext";
import QuantityStepper from "./QuantityStepper";
import AddressAutocomplete from "./AddressAutocomplete";
import { calculateDistance } from "../lib/api";
import { priceForSelection } from "../data/outlets";
import {
  MAX_DELIVERY_KM,
  deliveryChargeForDistance,
  deliverySlabLabel,
  parcelTotal,
  formatRupees,
} from "../lib/pricing";

export default function StepParcelDetails() {
  const { booking, update, goNext, goBack } = useBooking();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const unitPrice = priceForSelection(booking.date, "parcel");
  const charge = deliveryChargeForDistance(booking.distanceKm);
  const outOfRange = booking.distanceKm != null && booking.distanceKm > MAX_DELIVERY_KM;
  const total = charge != null ? parcelTotal(booking.quantity, unitPrice, charge) : null;

  async function handleCheckDistance() {
    if (!booking.address.trim()) {
      setError("Enter a delivery address first.");
      return;
    }
    setError(null);
    setChecking(true);
    try {
      const res = await calculateDistance({
        outletId: booking.outletId,
        address: booking.address,
        postcode: booking.postcode,
        lat: booking.addressLat,
        lng: booking.addressLng,
      });
      update({ distanceKm: res.distance_km });
    } catch (e) {
      setError("Couldn't calculate distance. Please check the address and try again.");
    } finally {
      setChecking(false);
    }
  }

  function handleContinue() {
    if (total == null) {
      setError("Please calculate your delivery charge before continuing.");
      return;
    }
    update({ totalAmount: total });
    goNext();
  }

  return (
    <div className="step-card">
      <div className="back-nav">
        <button className="btn-ghost" onClick={goBack}>← Back</button>
      </div>
      <h2 className="choice-card__title" style={{ fontSize: 20, marginBottom: 16 }}>
        Parcel — home delivery
      </h2>

      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label className="field__label">How many Sadhya?</label>
        <QuantityStepper
          value={booking.quantity}
          onChange={(v) => update({ quantity: v })}
          unitLabel={`${formatRupees(unitPrice)} each`}
        />
      </div>

      <div className="field">
        <label className="field__label">Delivery address</label>
        <AddressAutocomplete
          value={booking.address}
          onChange={(val) =>
            update({ address: val, distanceKm: null, addressLat: null, addressLng: null })
          }
          onSelectSuggestion={(s) =>
            update({
              address: s.full_address,
              postcode: s.postcode || booking.postcode,
              addressLat: s.lat,
              addressLng: s.lon,
              distanceKm: null,
            })
          }
        />
        <p className="field__hint">Start typing and pick your address from the list.</p>
      </div>

      <div className="field">
        <label className="field__label">Postcode</label>
        <input
          className="field__input"
          placeholder="e.g. 410210"
          value={booking.postcode}
          onChange={(e) => update({ postcode: e.target.value, distanceKm: null })}
        />
        <p className="field__hint">Helps us calculate your delivery charge accurately.</p>
      </div>

      {booking.distanceKm == null ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginBottom: 20 }}
          onClick={handleCheckDistance}
          disabled={checking}
        >
          {checking ? "Calculating…" : "Calculate delivery charge"}
        </button>
      ) : checking ? null : (
        <div className="summary">
          {outOfRange ? (
            <p className="summary__note" style={{ fontSize: 14, margin: 0 }}>
              Sorry, we don't deliver beyond {MAX_DELIVERY_KM} km. Please choose another
              Grace outlet closer to you, or switch to takeaway.
            </p>
          ) : (
            <>
              <div className="summary__row">
                <span>Distance</span>
                <span className="amount">
                  {booking.distanceKm} km · {deliverySlabLabel(booking.distanceKm)}
                </span>
              </div>
              <div className="summary__row">
                <span>Sadhya × {booking.quantity}</span>
                <span className="amount">{formatRupees(booking.quantity * unitPrice)}</span>
              </div>
              <div className="summary__row">
                <span>Delivery charge</span>
                <span className="amount">{formatRupees(charge)}</span>
              </div>
              <div className="summary__row is-total">
                <span>Total</span>
                <span className="amount">{formatRupees(total)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {checking && (
        <div className="loader-row">
          <div className="pookalam-loader" role="status" aria-label="Calculating distance" />
          <span className="loader-row__label">Calculating distance…</span>
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleContinue}
        disabled={outOfRange || total == null}
      >
        Continue
      </button>
    </div>
  );
}
