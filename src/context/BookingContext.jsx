import { createContext, useContext, useMemo, useState } from "react";

const STEPS = [
  "date",
  "type",
  "outlet",
  "details",
  "customer",
  "confirmation",
];

const initialBooking = {
  date: null,        // e.g. "2026-08-25"
  outletId: null,
  orderType: null,   // "parcel" | "table" | "takeaway"

  // parcel
  quantity: 1,
  address: "",
  postcode: "",
  addressLat: null,   // set when user picks an autocomplete suggestion —
  addressLng: null,   // lets distance calc skip re-geocoding entirely
  distanceKm: null,
  deliveryCharge: null,

  // table
  partySize: 1,

  // takeaway
  takeawayQuantity: 1,

  // customer
  name: "",
  phone: "",
  email: "",

  // result
  orderId: null,
  totalAmount: null,
};

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [booking, setBooking] = useState(initialBooking);

  const api = useMemo(
    () => ({
      step: STEPS[stepIndex],
      stepIndex,
      totalSteps: STEPS.length - 1, // confirmation isn't part of the visible trail
      booking,
      update(patch) {
        setBooking((prev) => ({ ...prev, ...patch }));
      },
      goNext() {
        setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
      },
      goBack() {
        setStepIndex((i) => Math.max(i - 1, 0));
      },
      goTo(stepName) {
        const idx = STEPS.indexOf(stepName);
        if (idx >= 0) setStepIndex(idx);
      },
      reset() {
        setBooking(initialBooking);
        setStepIndex(0);
      },
    }),
    [stepIndex, booking]
  );

  return <BookingContext.Provider value={api}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
