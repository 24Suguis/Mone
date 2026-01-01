import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import savedPlacesIcon from "../../../resources/iconSavedPlaces.png";
import { placeViewmodel } from "../../viewmodel/placeViewmodel";

const MIN_QUERY_LENGTH = 3;
const SUGGESTION_LIMIT = 6;
const SUGGESTION_DELAY = 350;
const AUTO_PICK_DISTANCE_METERS = 120;
const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceMeters = (origin, target) => {
  if (!Array.isArray(origin) || !Array.isArray(target)) return Number.POSITIVE_INFINITY;
  const [lat1, lng1] = origin.map((piece) => Number(piece));
  const [lat2, lng2] = target.map((piece) => Number(piece));
  if (![lat1, lng1, lat2, lng2].every((piece) => Number.isFinite(piece))) {
    return Number.POSITIVE_INFINITY;
  }
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};
const isCoordinateToken = (value) => {
  if (!value) return false;
  const parts = value.split(",").map((item) => item.trim());
  if (parts.length !== 2) return false;
  return parts.every((piece) => {
    const parsed = parseFloat(piece);
    return Number.isFinite(parsed);
  });
};

const parseCoordinateValue = (value) => {
  if (!isCoordinateToken(value)) return null;
  const [lat, lng] = value.split(",").map((piece) => parseFloat(piece.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
};

const normalizeSuggestionKey = (suggestion) => {
  if (!suggestion) return "unknown-suggestion";
  const lat = Number(suggestion.latitude);
  const lng = Number(suggestion.longitude);
  return suggestion.id ?? `${suggestion.label}-${lat}-${lng}`;
};

const formatLatLng = ([lat, lng]) => `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;

export default function LocationInput({
  label,
  value,
  onChange,
  onCoordsChange,
  onRequestSavedPlaces,
  autoSuggest = true,
  autoComplete = "off",
  placeholder = "Enter a place name or coordinates",
  externalError = "",
  autoPickFirstSuggestion = false,
  onAutoPickComplete,
  autoPickSourceCoords = null,
}) {
  const [inputValue, setInputValue] = useState(value ?? "");
  const [coords, setCoords] = useState(() => parseCoordinateValue(value));
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const manualChangeRef = useRef(false);

  const hasSuggestions = suggestions.length > 0;
  const shouldShowSuggestions = isManualEntry && hasSuggestions;
  const showLoadingBadge = loading && isManualEntry;

  useEffect(() => {
    setInputValue(value ?? "");
    setCoords(parseCoordinateValue(value));
    if (manualChangeRef.current) {
      manualChangeRef.current = false;
    } else {
      setIsManualEntry(false);
    }
  }, [value]);

  useEffect(() => {
    const shouldFetch = autoSuggest && (isManualEntry || autoPickFirstSuggestion);
    if (!shouldFetch) {
      setSuggestions([]);
      setSuggestionError("");
      setLoading(false);
      return undefined;
    }
    const trimmed = inputValue.trim();
    if (isCoordinateToken(trimmed) || trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setSuggestionError("");
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await placeViewmodel.suggestToponyms(trimmed, SUGGESTION_LIMIT);
        if (!cancelled) {
          setSuggestions(results);
          setSuggestionError("");
        }
      } catch (err) {
        if (!cancelled) {
          setSuggestions([]);
          setSuggestionError(err?.message || "No se pudieron cargar las sugerencias.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, SUGGESTION_DELAY);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputValue, autoSuggest, isManualEntry, autoPickFirstSuggestion]);

  const handleInputChange = (event) => {
    const nextValue = event.target.value;
    manualChangeRef.current = true;
    setIsManualEntry(true);
    setInputValue(nextValue);
    setSuggestions([]);
    setSuggestionError("");
    onChange?.(nextValue);
    const maybeCoords = parseCoordinateValue(nextValue);
    setCoords(maybeCoords);
    onCoordsChange?.(maybeCoords ?? null);
  };

  const handleSuggestionSelect = useCallback((suggestion, options = {}) => {
    const { preserveCoords = false, referenceCoords = null } = options;
    const lat = Number(suggestion.latitude);
    const lng = Number(suggestion.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const nextValue = suggestion.label;
    const suggestionCoords = [lat, lng];
    const resolvedCoords = preserveCoords && Array.isArray(referenceCoords) ? referenceCoords : suggestionCoords;
    setInputValue(nextValue);
    if (!preserveCoords) {
      setCoords(suggestionCoords);
    }
    setSuggestions([]);
    setSuggestionError("");
    onChange?.(nextValue);
    if (Array.isArray(resolvedCoords)) {
      onCoordsChange?.(resolvedCoords, suggestion.label);
    }
  }, [onChange, onCoordsChange]);

  useEffect(() => {
    if (!autoPickFirstSuggestion) return undefined;
    if (!suggestions.length) return undefined;

    const finish = () => {
      onAutoPickComplete?.();
    };

    const referenceCoords = Array.isArray(autoPickSourceCoords) ? autoPickSourceCoords : coords;
    if (!Array.isArray(referenceCoords)) {
      finish();
      return undefined;
    }

    const candidate = suggestions[0];
    const candidateCoords = [Number(candidate?.latitude), Number(candidate?.longitude)];
    if (!candidate || !candidateCoords.every((piece) => Number.isFinite(piece))) {
      finish();
      return undefined;
    }

    const distance = haversineDistanceMeters(referenceCoords, candidateCoords);
    if (distance <= AUTO_PICK_DISTANCE_METERS) {
      handleSuggestionSelect(candidate, { preserveCoords: true, referenceCoords });
    }

    finish();
    return undefined;
  }, [
    autoPickFirstSuggestion,
    suggestions,
    autoPickSourceCoords,
    coords,
    onAutoPickComplete,
    handleSuggestionSelect,
  ]);

  const resolvedState = useMemo(() => ({
    inputValue,
    coords,
  }), [inputValue, coords]);

  return (
    <div className="form-row field-row location-input " data-state={JSON.stringify(resolvedState)}>
      {label && <label>{label}</label>}
      <div className="input-with-btn" style={{ position: "relative" }}>
        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          autoComplete={autoComplete}
        />
        {inputValue && (
          <button
            type="button"
            className="clear-btn"
            title="Clear"
            onClick={(e) => {
              e.preventDefault();
              manualChangeRef.current = true;
              setIsManualEntry(true);
              setInputValue("");
              setCoords(null);
              setSuggestions([]);
              setSuggestionError("");
              onChange?.("");
              onCoordsChange?.(null);
            }}
            style={{
              position: "absolute",
              right: "3.6rem",
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              fontSize: "1.3rem",
              cursor: "pointer",
              padding: "0 0 rem",
              color: "#b90303ff",
            }}
          >
            ×
          </button>
        )}
        {showLoadingBadge && (
          <span
            className="info-text"
            style={{
              position: "absolute",
              top: "50%",
              right: "3rem",
              transform: "translateY(-50%)",
              fontSize: "0.75rem",
              padding: "0.1rem 0.35rem",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.85)",
              boxShadow: "0 0 4px rgba(0, 0, 0, 0.1)",
              pointerEvents: "none",
            }}
          >
            Buscando…
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem" }}>
          <button type="button" className="picker-btn" title="Choose saved place" onClick={onRequestSavedPlaces}>
            <img src={savedPlacesIcon} alt="Choose saved place" />
          </button>
        </div>
        {shouldShowSuggestions && (
          <ul
            className="saved-list"
            style={{
              position: "absolute",
              top: "65%",
              left: 0,
              right: 0,
              zIndex: 20,
              maxHeight: 200,
              overflowY: "auto",
              background: "var(--color-secondary)",
              border: "1px solid #ddd",
              marginTop: "4px",
            }}
          >
            {suggestions.map((suggestion) => (
              <li
                key={normalizeSuggestionKey(suggestion)}
                className="saved-item"
                onMouseDown={(event) => {
                  event.preventDefault();
                  handleSuggestionSelect(suggestion);
                }}
              >
                <div className="saved-title">{suggestion.label}</div>
                <div className="saved-coords">
                  {suggestion.context || ""}
                  {suggestion.context ? " • " : ""}
                  {formatLatLng([suggestion.latitude, suggestion.longitude])}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(suggestionError || externalError) && (
        <p className="error-text" style={{ marginTop: "0.4rem" }}>
          {suggestionError || externalError}
        </p>
      )}
    </div>
  );
}
