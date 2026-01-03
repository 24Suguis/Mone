import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomSwal from "../../core/utils/CustomSwal.js";
import EditDeleteActions from "../components/EditDeleteActions.jsx";
import FavoriteToggle from "../components/FavoriteToggle.jsx";
import { useRouteViewmodel } from "../../viewmodel/routeViewmodel";
import { placeViewmodel } from "../../viewmodel/placeViewmodel";

const PLUS_ICON_PATH = "M12 2a1 1 0 0 1 1 1v8h8a1 1 0 1 1 0 2h-8v8a1 1 0 1 1-2 0v-8H3a1 1 0 1 1 0-2h8V3a1 1 0 0 1 1-1z";
const ROUTE_ICON_SRC = "../../../resources/route.png";
const ROUTE_ICON_STYLE = { width: "28px", height: "28px", objectFit: "contain" };
const LABEL_CACHE_KEY = "mone.route.toponyms";

const parseLatLng = (value) => {
  if (!value) return null;
  const parts = String(value)
    .split(",")
    .map((piece) => parseFloat(piece.trim()));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1]];
};

const toRadians = (deg) => (deg * Math.PI) / 180;
const distanceMeters = (a, b) => {
  if (!a || !b) return Infinity;
  const R = 6371000;
  const dLat = toRadians(b[0] - a[0]);
  const dLon = toRadians(b[1] - a[1]);
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const normalizePlaceRecord = (place) => {
  if (!place) return null;
  const coordsCandidate = Array.isArray(place.coords)
    ? place.coords
    : Array.isArray(place.latitude)
      ? place.latitude
      : [Number(place.latitude ?? place.lat ?? place.latitude), Number(place.longitude ?? place.lng ?? place.longitude)];
  const lat = Number(coordsCandidate?.[0]);
  const lng = Number(coordsCandidate?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const label = place.name || place.label || place.toponymicAddress || undefined;
  return { ...place, coords: [lat, lng], label };
};

const findNearestPlaceLabel = (coords, places, maxMeters = 75) => {
  if (!Array.isArray(places)) return null;
  let best = null;
  for (const p of places) {
    if (!Array.isArray(p?.coords)) continue;
    const dist = distanceMeters(coords, p.coords);
    if (dist <= maxMeters) {
      best = p.label || p.name || p.toponymicAddress;
      break;
    }
  }
  return best;
};

const readLabelCache = () => {
  try {
    const raw = localStorage.getItem(LABEL_CACHE_KEY);
    if (!raw) return { coords: {}, routes: {} };
    const parsed = JSON.parse(raw);
    return {
      coords: parsed?.coords && typeof parsed.coords === "object" ? parsed.coords : {},
      routes: parsed?.routes && typeof parsed.routes === "object" ? parsed.routes : {},
    };
  } catch {
    return { coords: {}, routes: {} };
  }
};

const persistLabelCache = (cache) => {
  try {
    localStorage.setItem(LABEL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore storage failures */
  }
};
export default function ListRoutes() {
  const navigate = useNavigate();
  const { listSavedRoutes, deleteSavedRoute, setFavorite } = useRouteViewmodel();

  const [routes, setRoutes] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [resolvedLabels, setResolvedLabels] = useState({});
  const labelCacheRef = useRef(readLabelCache());

  const loadRoutes = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await listSavedRoutes();
      setRoutes(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || "Unable to load routes.");
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadPlaces = useCallback(async () => {
    try {
      const results = await placeViewmodel.getPlaces();
      const normalized = Array.isArray(results)
        ? results
            .map((p) => normalizePlaceRecord(p))
            .filter(Boolean)
        : [];
      setSavedPlaces(normalized);
    } catch {
      setSavedPlaces([]);
    }
  }, []);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const filteredRoutes = useMemo(() => {
    if (!query.trim()) return routes;
    const needle = query.trim().toLowerCase();
    return routes.filter((route) => {
      const parts = [
        route?.name,
        route?.origin,
        route?.destination,
        route?.mobilityType,
        route?.routeType,
      ]
        .filter((segment) => segment !== undefined && segment !== null)
        .map((segment) => String(segment).toLowerCase());
      return parts.some((segment) => segment.includes(needle));
    });
  }, [routes, query]);

  const recentRoutes = useMemo(() => filteredRoutes.slice(0, 3), [filteredRoutes]);
  const favoriteRoutes = useMemo(
    () => filteredRoutes.filter((route) => Boolean(route?.isFavorite || route?.favorite)),
    [filteredRoutes]
  );
  const remainingRoutes = useMemo(() => {
    const favIds = new Set(favoriteRoutes.map((r) => r?.id));
    return filteredRoutes.filter((route) => !favIds.has(route?.id));
  }, [filteredRoutes, favoriteRoutes]);

  const handleAddRoute = () => {
    navigate("/routes/new");
  };

  const handleOpenRoute = (routeId) => {
    const route = routes.find((r) => r?.id === routeId);
    navigate(`/routes/details/${routeId}`, { state: route ? { savedRoute: route } : undefined });
  };

  const handleEditRoute = (routeId) => {
    const route = routes.find((r) => r?.id === routeId);
    navigate(`/routes/edit/${routeId}`, { state: route ?? {} });
  };

  const handleDeleteRoute = async (routeId) => {
    const route = routes.find((r) => r?.id === routeId);
    const result = await CustomSwal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${route?.name || "Unnamed route"}". This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, delete",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setDeletingId(routeId);
    try {
      await deleteSavedRoute(routeId);
      setRoutes((prev) => prev.filter((item) => item.id !== routeId));
      await CustomSwal.fire({
        title: "Deleted!",
        text: `"${route?.name || "Unnamed route"}" has been removed successfully.`,
        icon: "success",
      });
    } catch (err) {
      setError(err?.message || "Unable to delete route.");
    } finally {
      setDeletingId("");
    }
  };

  const handleToggleFavorite = async (routeId, current) => {
    // Optimistic UI update to avoid scroll jumps from full reloads
    setRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, favorite: !current, isFavorite: !current } : r))
    );
    try {
      await setFavorite(routeId, !current);
    } catch (err) {
      // Rollback on error
      setRoutes((prev) =>
        prev.map((r) => (r.id === routeId ? { ...r, favorite: current, isFavorite: current } : r))
      );
      setError(err?.message || "Unable to update favorite.");
    }
  };

  const resolveLocationLabel = useCallback(
    async (raw, routeId, field) => {
      if (!raw) return null;
      const coords = parseLatLng(raw);
      if (!coords) return raw;

      // 1) route-level cache (may come from previous fetch or persisted)
      const routeCache = labelCacheRef.current.routes?.[routeId]?.[field];
      if (routeCache) return routeCache;

      // 2) coords-level cache
      const cacheKey = `${coords[0].toFixed(5)},${coords[1].toFixed(5)}`;
      const cached = labelCacheRef.current.coords?.[cacheKey];
      if (cached) return cached;

      // 3) nearby saved place
      const savedLabel = findNearestPlaceLabel(coords, savedPlaces);
      if (savedLabel) {
        const next = { ...labelCacheRef.current };
        next.coords = { ...next.coords, [cacheKey]: savedLabel };
        if (routeId) {
          next.routes = {
            ...next.routes,
            [routeId]: { ...(next.routes?.[routeId] || {}), [field]: savedLabel },
          };
        }
        labelCacheRef.current = next;
        persistLabelCache(next);
        return savedLabel;
      }

      // 4) reverse geocode
      try {
        const suggestion = await placeViewmodel.toponymFromCoords(coords[0], coords[1]);
        const label = suggestion?.label || raw;
        const next = { ...labelCacheRef.current };
        next.coords = { ...next.coords, [cacheKey]: label };
        if (routeId) {
          next.routes = {
            ...next.routes,
            [routeId]: { ...(next.routes?.[routeId] || {}), [field]: label },
          };
        }
        labelCacheRef.current = next;
        persistLabelCache(next);
        return label;
      } catch {
        return raw;
      }
    },
    [savedPlaces]
  );

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.all(
        routes.map(async (route) => {
          const originLabel = await resolveLocationLabel(route?.origin, route?.id, "origin");
          const destinationLabel = await resolveLocationLabel(route?.destination, route?.id, "destination");
          return [route?.id, { origin: originLabel, destination: destinationLabel }];
        })
      );
      if (cancelled) return;
      setResolvedLabels((prev) => {
        const next = { ...prev };
        entries.forEach(([id, value]) => {
          if (id) next[id] = value;
        });
        return next;
      });
    };
    if (routes.length) run();
    else setResolvedLabels({});
    return () => {
      cancelled = true;
    };
  }, [routes, resolveLocationLabel]);

  const formatMeta = (route) => {
    const labels = resolvedLabels[route?.id] ?? {};
    const originLabel = labels.origin ?? route?.originLabel ?? route?.origin;
    const destinationLabel = labels.destination ?? route?.destinationLabel ?? route?.destination;
    const parts = [];
    if (originLabel && destinationLabel) parts.push(`${originLabel} → ${destinationLabel}`);
    if (route?.mobilityType) parts.push(route.mobilityType);
    if (route?.routeType) parts.push(route.routeType);
    return parts.join(" · ");
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">My Routes</h1>
        <button type="button" className="btn btn-primary btn-add" onClick={handleAddRoute}>
          <svg className="add-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d={PLUS_ICON_PATH} />
          </svg>
          New Route
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search-bar"
          type="search"
          placeholder="Search routes by name or location..."
          aria-label="Search routes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="error-text" style={{ marginBottom: "0.75rem" }}>
          {error}
          <button type="button" className="btn btn-secondary" style={{ marginLeft: "0.5rem" }} onClick={loadRoutes}>
            Retry
          </button>
        </div>
      )}

      <section className="list-section">
        <h2 className="section-title">Recent</h2>
        <ul className="item-list">
          {loading ? (
            <li className="item-card item-card--empty">Loading routes...</li>
          ) : recentRoutes.length === 0 ? (
            <li className="item-card item-card--empty">
              {routes.length === 0 ? "You have not saved any routes yet." : "No recent routes match your search."}
            </li>
          ) : (
            recentRoutes.map((route) => (
              <li
                key={route.id}
                className={`item-card ${deletingId === route.id ? "item-card--disabled" : ""}`}
                onClick={() => handleOpenRoute(route.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenRoute(route.id);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
              >
                <div className="item-card__icon" aria-hidden>
                  <img src={ROUTE_ICON_SRC} alt="Route icon" style={ROUTE_ICON_STYLE} />
                </div>
                <div className="item-card__content">
                  <div className="item-card__title" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span>{route?.name || "Unnamed route"}</span>
                    <FavoriteToggle
                      active={Boolean(route?.favorite || route?.isFavorite)}
                      onToggle={(next) => handleToggleFavorite(route.id, route?.favorite || route?.isFavorite)}
                      label="Toggle favorite route"
                    />
                  </div>
                  <div className="item-card__meta">{formatMeta(route) || "No extra information"}</div>
                </div>
                <EditDeleteActions id={route?.id} onEdit={handleEditRoute} onDelete={handleDeleteRoute} />
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="list-section">
        <h2 className="section-title">Favorites</h2>
        <ul className="item-list">
          {loading ? (
            <li className="item-card item-card--empty">Loading routes...</li>
          ) : favoriteRoutes.length === 0 ? (
            <li className="item-card item-card--empty">
              {favoriteRoutes.length === 0
                ? "No favorite routes yet."
                : filteredRoutes.length === 0
                  ? "No routes match your search."
                  : "Mark some routes as favorites to see them here."}
            </li>
          ) : (
            favoriteRoutes.map((route) => (
              <li
                key={route.id}
                className={`item-card ${deletingId === route.id ? "item-card--disabled" : ""}`}
                onClick={() => handleOpenRoute(route.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenRoute(route.id);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
              >
                <div className="item-card__icon" aria-hidden>
                  <img src={ROUTE_ICON_SRC} alt="Route icon" style={ROUTE_ICON_STYLE} />
                </div>
                <div className="item-card__content">
                  <div className="item-card__title" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span>{route?.name || "Unnamed route"}</span>
                    <FavoriteToggle
                      active={Boolean(route?.favorite || route?.isFavorite)}
                      onToggle={(next) => handleToggleFavorite(route.id, route?.favorite || route?.isFavorite)}
                      label="Toggle favorite route"
                    />
                  </div>
                  <div className="item-card__meta">{formatMeta(route) || "No extra information"}</div>
                </div>
                <EditDeleteActions id={route?.id} onEdit={handleEditRoute} onDelete={handleDeleteRoute} />
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="list-section">
        <h2 className="section-title">All Saved Routes</h2>
        <ul className="item-list">
          {loading ? (
            <li className="item-card item-card--empty">Loading routes...</li>
          ) : remainingRoutes.length === 0 ? (
            <li className="item-card item-card--empty">
              {filteredRoutes.length === 0 ? "No routes match your search." : "All filtered routes are shown above."}
            </li>
          ) : (
            remainingRoutes.map((route) => (
              <li
                key={route.id}
                className={`item-card ${deletingId === route.id ? "item-card--disabled" : ""}`}
                onClick={() => handleOpenRoute(route.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenRoute(route.id);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer" }}
              >
                <div className="item-card__icon" aria-hidden>
                  <img src={ROUTE_ICON_SRC} alt="Route icon" style={ROUTE_ICON_STYLE} />
                </div>
                <div className="item-card__content">
                  <div className="item-card__title" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span>{route?.name || "Unnamed route"}</span>
                    <FavoriteToggle
                      active={Boolean(route?.favorite || route?.isFavorite)}
                      onToggle={(next) => handleToggleFavorite(route.id, route?.favorite || route?.isFavorite)}
                      label="Toggle favorite route"
                    />
                  </div>
                  <div className="item-card__meta">{formatMeta(route) || "No extra information"}</div>
                </div>
                <EditDeleteActions id={route?.id} onEdit={handleEditRoute} onDelete={handleDeleteRoute} />
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
