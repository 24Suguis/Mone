import React, { useEffect, useState } from "react";
import { placeViewmodel } from "../../viewmodel/placeViewmodel";

export default function SavedPlacesModal({ open, onSelect, onClose, title = "Choose saved place" }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const results = await placeViewmodel.getPlaces();
        if (!cancelled) {
          const normalized = Array.isArray(results)
            ? results.map((p) => ({
                ...p,
                coords: Array.isArray(p.coords)
                  ? p.coords
                  : Array.isArray(p.latitude) // defensive
                  ? p.latitude
                  : [Number(p.latitude ?? p.latitude), Number(p.longitude ?? p.longitude)],
              }))
            : [];
          const final = normalized.map((p) => {
            if (Array.isArray(p.coords) && p.coords.length === 2 && p.coords.every((n) => Number.isFinite(Number(n)))) return p;
            const lat = Number(p.latitude ?? p.lat ?? NaN);
            const lng = Number(p.longitude ?? p.lng ?? NaN);
            if (Number.isFinite(lat) && Number.isFinite(lng)) return { ...p, coords: [lat, lng] };
            return p;
          });
          setPlaces(final);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "No se pudieron cargar los lugares guardados.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="saved-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="saved-modal-header">
          <h3>{title}</h3>
          <button className="picker-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {loading && <p className="info-text">Cargando lugares guardados…</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && (
          <ul className="saved-list">
            {places.map((p) => (
              <li
                key={p.id}
                className="saved-item"
                onClick={() => {
                  try {
                    onSelect?.(p);
                  } finally {
                    onClose?.();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    try {
                      onSelect?.(p);
                    } finally {
                      onClose?.();
                    }
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="saved-title">{p.name}</div>
                <div className="saved-coords">{Array.isArray(p.coords) ? `${p.coords[0]}, ${p.coords[1]}` : ""}</div>
              </li>
            ))}
            {places.length === 0 && <li className="saved-item">No hay lugares guardados.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}