import { useEffect, useRef, useState } from "react";
import { autocompleteAddress } from "../lib/api";

// Google Maps-style search box: as the user types, shows a dropdown of
// nearby matching places. Selecting one fills the address (and postcode,
// when available) and closes the dropdown.
export default function AddressAutocomplete({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "Street, area, landmark",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Debounced fetch — waits 400ms after the user stops typing before
  // calling the API, so we don't fire a request on every keystroke.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await autocompleteAddress(value);
        setSuggestions(results);
        setOpen(results.length > 0);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  // Close the dropdown when clicking outside the component.
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pick(suggestion) {
    onChange(suggestion.full_address);
    onSelectSuggestion?.(suggestion);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="address-autocomplete" ref={wrapperRef}>
      <div className="address-autocomplete__input-wrap">
        <textarea
          className="field__textarea"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {loading && <span className="address-autocomplete__spinner" aria-hidden="true" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="address-autocomplete__dropdown" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lon}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`address-autocomplete__item${i === activeIndex ? " is-active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault(); // keep textarea focus/value stable before onChange fires
                pick(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="address-autocomplete__pin" aria-hidden="true">
                📍
              </span>
              <span className="address-autocomplete__text">
                <span className="address-autocomplete__label">{s.label}</span>
                <span className="address-autocomplete__sub">{s.full_address}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
