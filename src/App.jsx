import { BookingProvider, useBooking } from "./context/BookingContext";
import ProgressTrail from "./components/ProgressTrail";
import StepDate from "./components/StepDate";
import StepOutlet from "./components/StepOutlet";
import StepType from "./components/StepType";
import StepParcelDetails from "./components/StepParcelDetails";
import StepTableDetails from "./components/StepTableDetails";
import StepTakeawayDetails from "./components/StepTakeawayDetails";
import StepCustomer from "./components/StepCustomer";
import StepConfirmation from "./components/StepConfirmation";

function FlowStep() {
  const { step, booking } = useBooking();

  switch (step) {
    case "date":
      return <StepDate />;
    case "outlet":
      return <StepOutlet />;
    case "type":
      return <StepType />;
    case "details":
      if (booking.orderType === "parcel") return <StepParcelDetails />;
      if (booking.orderType === "table") return <StepTableDetails />;
      return <StepTakeawayDetails />;
    case "customer":
      return <StepCustomer />;
    case "confirmation":
      return <StepConfirmation />;
    default:
      return null;
  }
}

function BookingApp() {
  return (
    <div className="app-shell">
      <div className="kasavu-border" />
      <header className="app-header">
        <div className="app-header__mark">Onam Sadhya</div>
        <h1 className="app-header__title">Grace Restaurant</h1>
        <p className="app-header__subtitle">Book a parcel, a table, or a takeaway</p>
      </header>
      <ProgressTrail />
      <main className="app-main">
        <FlowStep />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BookingProvider>
      <BookingApp />
    </BookingProvider>
  );
}
