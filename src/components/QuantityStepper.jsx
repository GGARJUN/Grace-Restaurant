export default function QuantityStepper({ value, onChange, min = 1, max = 999, unitLabel }) {
  function clamp(v) {
    return Math.max(min, Math.min(max, v));
  }
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(clamp(value - 1))}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="stepper__value">{value}</span>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase"
      >
        +
      </button>
      {unitLabel && <span className="field__hint" style={{ margin: 0 }}>{unitLabel}</span>}
    </div>
  );
}
