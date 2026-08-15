import { useBooking } from "../context/BookingContext";

const LABELS = ["Date", "Order", "Outlet", "Details", "Your info"];

export default function ProgressTrail() {
  const { stepIndex, totalSteps } = useBooking();

  if (stepIndex >= totalSteps + 1) return null; // hide on confirmation

  return (
    <div className="trail" aria-label="Booking progress">
      {LABELS.map((label, i) => (
        <div
          key={label}
          className={`trail__fold ${
            i < stepIndex ? "is-done" : i === stepIndex ? "is-active" : ""
          }`}
          role="img"
          aria-label={`${label}${i <= stepIndex ? " (complete)" : ""}`}
        />
      ))}
    </div>
  );
}
