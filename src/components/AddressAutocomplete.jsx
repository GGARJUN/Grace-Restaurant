import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../lib/googleMapsLoader";

// Google Maps-style search box — this now talks to Google directly from
// the browser using the Maps JavaScript API's Places Autocomplete widget,
// no backend involved. Google renders its own dropdown (the floating
// ".pac-container" you'll see in devtools) below the input; we just read
// the result out of the "place_changed" event when the user picks one.
export default function AddressAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "Street, area, landmark",
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const listenerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !inputRef.current) return;

        autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: "in" },
          fields: ["formatted_address", "geometry", "address_components", "name"],
        });

        listenerRef.current = autocompleteRef.current.addListener(
          "place_changed",
          handlePlaceChanged
        );

        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Google Maps failed to load:", err.message);
        setStatus("error");
        setErrorMessage(err.message);
      });

    return () => {
      cancelled = true;
      if (listenerRef.current && window.google?.maps) {
        window.google.maps.event.removeListener(listenerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attach once
  }, []);

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry) {
      // Happens if the user hits Enter without picking a dropdown option —
      // nothing to resolve, so leave whatever text they typed as-is.
      return;
    }

    const postcodeComponent = (place.address_components || []).find((c) =>
      c.types.includes("postal_code")
    );

    const fullAddress = place.formatted_address || place.name || "";
    onChange(fullAddress);
    onSelectSuggestion?.({
      label: place.name || fullAddress,
      full_address: fullAddress,
      lat: place.geometry.location.lat(),
      lon: place.geometry.location.lng(),
      postcode: postcodeComponent?.long_name || "",
    });
  }

  return (
    <div className="address-autocomplete">
      <div className="address-autocomplete__input-wrap">
        <input
          ref={inputRef}
          type="text"
          className="field__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          disabled={status === "loading"}
        />
        {status === "loading" && (
          <span className="address-autocomplete__spinner" aria-hidden="true" />
        )}
      </div>

      {status === "error" && (
        <p className="address-autocomplete__error">
          Address search isn't available right now ({errorMessage}). You can still type your
          address manually.
        </p>
      )}
    </div>
  );
}
