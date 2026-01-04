import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CustomSwal from "../../core/utils/CustomSwal";
import LeafletMap from "../components/LeafletMap";
import SavedPlacesModal from "../components/SavedPlacesModal";
import MobilitySelector from "../components/MobilitySelector";
import RouteTypeSelector from "../components/RouteTypeSelector";
import SelectVehicle from "../components/SelectVehicle";
import LocationInput from "../components/LocationInput";
import BackButton from "../components/BackButton";
import { useRouteViewmodel } from "../../viewmodel/routeViewmodel";
import { placeViewmodel } from "../../viewmodel/placeViewmodel";
import { VehicleViewModel } from "../../viewmodel/VehicleViewModel";
import {
    getUserDefaultOptions,
} from "../../viewmodel/UserViewModel";


const DEFAULT_CENTER = [39.99256, -0.067387];
const createLocationState = () => ({ value: "", coords: null, error: "" });
const formatLatLng = ([lat, lng]) => `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
const parseCoordsFromString = (text) => {
  if (!text) return null;
  const parts = text.split(",").map((piece) => parseFloat(piece.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
};

const normalizeMobilityKey = (mode) => {
  if (mode === "bike") return "bike";
  if (mode === "walk") return "walk";
  return "vehicle";
};

const inferMobilityFromVehicle = (vehicle) => {
  const type = typeof vehicle?.type === "string" ? vehicle.type.toLowerCase() : "";
  if (type === "bike") return "bike";
  if (type === "walking") return "walk";
  return "vehicle";
};

const formatConsumption = (value, unit) => {
  if (!Number.isFinite(value) || !unit) return null;
  return `${value.toFixed(1)} ${unit}`;
};

const normalizeVehicleConsumption = (vehicle) => {
  if (!vehicle?.consumption) return null;
  const base = vehicle.consumption;
  const maybeAmount = base.amount?.amount ?? base.amount;
  if (typeof maybeAmount === "number") {
    return {
      value: maybeAmount,
      unit: (base.amount?.unit ?? base.unit ?? "").toLowerCase() || null,
    };
  }
  return null;
};

const formatVehicleConsumptionDisplay = (vehicle) => {
  const normalized = normalizeVehicleConsumption(vehicle);
  if (!normalized) return null;
  return formatConsumption(normalized.value, normalized.unit ?? undefined);
};

export default function EditRoute() {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const {
    loading: vmLoading,
    error: requestError,
    previewRoute,
    reset: resetRouteVm,
    getSavedRoute,
    updateSavedRoute,
  } = useRouteViewmodel();
  const vehicleViewmodel = VehicleViewModel();
  const { vehicles } = vehicleViewmodel;

  const [origin, setOrigin] = useState(() => createLocationState());
  const [destination, setDestination] = useState(() => createLocationState());
  const [name, setName] = useState("");
  const [mobility, setMobility] = useState("vehicle");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [initialVehicleName, setInitialVehicleName] = useState("");
  const [routeType, setRouteType] = useState("fastest");
  const [prefs] = useState(null);
  const [defaultRouteType, setDefaultRouteType] = useState("fastest");
  const [defaultMobilityMethod, setDefaultMobilityMethod] = useState("vehicle");
  const [defaultVehicleName, setDefaultVehicleName] = useState("");

  useEffect(() => {
    const loadPrefs = async () => {
      const data = await getUserDefaultOptions();
      setDefaultRouteType(data?.routeType ?? "fastest");
      setDefaultMobilityMethod(data?.transportMode ?? "vehicle");
      setDefaultVehicleName(data?.vehicleName ?? "");
      setMobility(data?.transportMode ?? "vehicle");
      setRouteType(data?.routeType ?? "fastest");
    };
    loadPrefs();
  }, []);


  const [polyline, setPolyline] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [error, setError] = useState("");
  const [hasPreview, setHasPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(true);

  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedMode, setSavedMode] = useState("origin");

  const mutateLocation = (key, updater) => {
    if (key === "origin") {
      setOrigin((prev) => updater(prev));
    } else {
      setDestination((prev) => updater(prev));
    }
  };

  const invalidatePreview = () => {
    setPolyline([]);
    setHasPreview(false);
    setError("");
    resetRouteVm();
  };

  const handleLocationValueChange = (key, nextValue) => {
    invalidatePreview();
    mutateLocation(key, (prev) => ({ ...prev, value: nextValue, error: "" }));
  };

  const handleLocationCoordsChange = (key, coords, label, options = {}) => {
    const { invalidatePreview: shouldInvalidate = true } = options;
    if (shouldInvalidate) invalidatePreview();
    if (!Array.isArray(coords) || coords.length !== 2) {
      mutateLocation(key, (prev) => ({ ...prev, coords: null }));
      return;
    }
    const [lat, lng] = coords.map((piece) => Number(piece));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const formatted = label ?? formatLatLng([lat, lng]);
    mutateLocation(key, () => ({ value: formatted, coords: [lat, lng], error: "" }));
  };

  const resolveCoords = (key, state) => {
    if (state.coords) return state.coords;
    const parsed = parseCoordsFromString(state.value);
    if (parsed) {
      handleLocationCoordsChange(key, parsed, formatLatLng(parsed), { invalidatePreview: false });
      return parsed;
    }
    mutateLocation(key, (prev) => ({ ...prev, error: "Introduce coordenadas válidas o selecciona un lugar." }));
    return null;
  };

  const markers = useMemo(() => {
    if (polyline.length >= 2) {
      return [
        { coords: polyline[0], role: "origin" },
        { coords: polyline[polyline.length - 1], role: "destination" },
      ];
    }
    const next = [];
    if (origin.coords) next.push({ coords: origin.coords, role: "origin" });
    if (destination.coords) next.push({ coords: destination.coords, role: "destination" });
    return next;
  }, [origin.coords, destination.coords, polyline]);

  useEffect(() => {
    if (polyline.length >= 2) {
      const mid = polyline[Math.floor(polyline.length / 2)];
      setCenter([mid[0], mid[1]]);
      return;
    }
    if (origin.coords && destination.coords) {
      setCenter([
        (origin.coords[0] + destination.coords[0]) / 2,
        (origin.coords[1] + destination.coords[1]) / 2,
      ]);
      return;
    }
    if (origin.coords) {
      setCenter(origin.coords);
      return;
    }
    if (destination.coords) {
      setCenter(destination.coords);
      return;
    }
    setCenter(DEFAULT_CENTER);
  }, [origin.coords, destination.coords, polyline]);

  const openSavedModal = (mode) => {
    setSavedMode(mode);
    setShowSavedModal(true);
  };
  const closeSavedModal = () => setShowSavedModal(false);

  const handleReset = () => {
    invalidatePreview();
    setOrigin(createLocationState());
    setDestination(createLocationState());
    setCenter(DEFAULT_CENTER);
  };

  const selectSavedPlace = (place) => {
    if (!place?.coords) return;
    const lat = Number(place.coords[0]);
    const lng = Number(place.coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    handleLocationCoordsChange(savedMode, [lat, lng], place.name ?? formatLatLng([lat, lng]));
    setShowSavedModal(false);
  };

  const buildRouteRequest = () => {
    const originCoords = resolveCoords("origin", origin);
    const destinationCoords = resolveCoords("destination", destination);
    if (!originCoords || !destinationCoords) {
      return null;
    }
    return {
      originCoords,
      destinationCoords,
      origin: `${originCoords[0]},${originCoords[1]}`,
      destination: `${destinationCoords[0]},${destinationCoords[1]}`,
    };
  };

  const handlePreviewRoute = async () => {
    setError("");
    setHasPreview(false);
    setPolyline([]);
    const payload = buildRouteRequest();
    if (!payload) return;
    try {
      const preview = await previewRoute({
        origin: payload.origin,
        destination: payload.destination,
        mobilityType: mobility,
        routeType,
        vehicle: selectedVehicleRef ?? undefined,
      });
      const normalizedLine = Array.isArray(preview?.polyline)
        ? preview.polyline
            .map((point) => {
              if (!Array.isArray(point) || point.length < 2) return null;
              const lat = Number(point[0]);
              const lng = Number(point[1]);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              return [lat, lng];
            })
            .filter(Boolean)
        : [];
      if (normalizedLine.length < 2) {
        setError("No route could be calculated for the selected points.");
        return;
      }
      setPolyline(normalizedLine);
      const midPoint = normalizedLine[Math.floor(normalizedLine.length / 2)];
      if (Array.isArray(midPoint)) {
        setCenter([midPoint[0], midPoint[1]]);
      }
      setHasPreview(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to request route preview";
      setError(message);
    }
  };

  const handleSaveRoute = async () => {
    const payload = buildRouteRequest();
    if (!payload) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Route name is required to save.");
      return;
    }
    const originLabel = origin.value || payload.origin;
    const destinationLabel = destination.value || payload.destination;
    const vehicleSnapshot = selectedVehicleRef
      ? {
          name: selectedVehicleRef.name,
          type: selectedVehicleRef.type ?? null,
          fuelType: selectedVehicleRef.fuelType ?? null,
          consumption: selectedVehicleRef.consumption ?? null,
          favorite: selectedVehicleRef.favorite ?? undefined,
        }
      : null;
    setError("");
    setSaving(true);
    try {
      await updateSavedRoute(routeId, {
        name: trimmedName,
        origin: payload.origin,
        destination: payload.destination,
        originLabel,
        destinationLabel,
        mobilityType: mobility,
        mobilityMethod: mobility,
        vehicle: vehicleSnapshot,
        routeType,
      });
      await CustomSwal.fire({
        title: "Route Updated",
        text: `"${trimmedName}" has been saved successfully.`,
        icon: "success",
        confirmButtonText: "Close",
      });
      navigate("/routes");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update route";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (hasPreview) {
      await handleSaveRoute();
    } else {
      await handlePreviewRoute();
    }
  };

  useEffect(() => {
    setSelectedVehicle("");
  }, [mobility]);

  const vehicleOptions = useMemo(() => {
    if (!Array.isArray(vehicles)) return [];
    return vehicles.map((vehicle, index) => {
      const mobilityKey = inferMobilityFromVehicle(vehicle);
      return {
        id: `${mobilityKey}-${vehicle.name}-${index}`,
        name: vehicle.name,
        mobility: mobilityKey,
        favorite: Boolean(vehicle?.favorite),
        ref: vehicle,
      };
    });
  }, [vehicles]);

  const vehicleLookup = useMemo(() => {
    const map = new Map();
    vehicleOptions.forEach((option) => map.set(option.id, option.ref));
    return map;
  }, [vehicleOptions]);

  useEffect(() => { //inspirado en RouteDetails
    if (!defaultVehicleName) return;
    const match = vehicleOptions.find(
      (option) => option.name === defaultVehicleName && option.mobility === mobility
    );
    if (match && match.id !== selectedVehicle) {
      setSelectedVehicle(match.id);
    }
  }, [defaultVehicleName, vehicleOptions, mobility]);

  useEffect(() => {
    const isDefaultSelection = typeof selectedVehicle === "string" && selectedVehicle.startsWith("default-");
    if (selectedVehicle && !isDefaultSelection && !vehicleLookup.has(selectedVehicle)) {
      setSelectedVehicle("");
    }
  }, [selectedVehicle, vehicleLookup]);

  const selectedVehicleRef = useMemo(() => {
    if (!selectedVehicle) return null;
    return vehicleLookup.get(selectedVehicle) ?? null;
  }, [selectedVehicle, vehicleLookup]);

  const fetchVehiclesForMode = useCallback(
    async (mode) => {
      const normalized = normalizeMobilityKey(mode);
      return vehicleOptions
        .filter((option) => option.mobility === normalized)
        .map((option) => ({
          id: option.id,
          name: option.name,
          favorite: option.favorite,
          meta: formatVehicleConsumptionDisplay(option.ref) ?? undefined,
        }));
    },
    [vehicleOptions]
  );

  const fetchToponymForCoords = useCallback(async (key, coords) => {
    if (!Array.isArray(coords)) return;
    const [lat, lng] = coords;
    try {
      const suggestion = await placeViewmodel.toponymFromCoords(lat, lng);
      if (suggestion?.label) {
        mutateLocation(key, (prev) => {
          if (!prev.coords) return prev;
          if (prev.coords[0] !== lat || prev.coords[1] !== lng) return prev;
          return { ...prev, value: suggestion.label };
        });
      }
    } catch (err) {
      console.warn("EditRoute: unable to resolve toponym", err);
    }
  }, [mutateLocation]);

  const combinedError = error || requestError;
  const primaryButtonLabel = hasPreview
    ? (vmLoading || saving ? "Saving..." : "Save changes")
    : (vmLoading ? "Previewing..." : "Preview Route");

  const hydrateFromRoute = (route) => {
    setName(route?.name || "");
    const mobilityFromRoute = route?.mobilityType || route?.mobilityMethod || "vehicle";
    setMobility(mobilityFromRoute);
    setRouteType(route?.routeType || "fastest");
    setInitialVehicleName(route?.vehicle?.name || "");

    const originValue = route?.origin || "";
    const destValue = route?.destination || "";
    const originCoords = parseCoordsFromString(originValue);
    const destCoords = parseCoordsFromString(destValue);
    setOrigin({ value: originValue, coords: originCoords, error: "" });
    setDestination({ value: destValue, coords: destCoords, error: "" });
    setCenter(originCoords || destCoords || DEFAULT_CENTER);
  };

  useEffect(() => {
    if (!initialVehicleName) return;
    const match = vehicleOptions.find((option) => option.ref?.name === initialVehicleName || option.name === initialVehicleName);
    if (match) {
      setSelectedVehicle(match.id);
    }
  }, [initialVehicleName, vehicleOptions]);

  useEffect(() => {
    const loadRoute = async () => {
      setLoadingRoute(true);
      setError("");
      try {
        const initial = state && typeof state === "object" ? state : null;
        const fetched = await getSavedRoute(routeId);
        const route = fetched ?? initial;
        if (!route) {
          throw new Error("Route not found");
        }
        hydrateFromRoute(route);
      } catch (err) {
        const fallback = state && typeof state === "object" ? state : null;
        if (fallback) {
          hydrateFromRoute(fallback);
        } else {
          setError(err?.message || "Unable to load route");
        }
      } finally {
        setLoadingRoute(false);
      }
    };
    loadRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  return (
    <section className="place-row">
      <aside className="place-card default-container with-border">
        <BackButton label="Back" style={{ marginBottom: "0.25rem" }} />
        <h2 className="card-title">Edit Route</h2>

        {combinedError && (
          <p className="error-text" style={{ marginBottom: "0.75rem" }}>
            {combinedError}
          </p>
        )}

        {loadingRoute ? (
          <div className="item-card item-card--empty">Loading route...</div>
        ) : (
          <form onSubmit={handleFormSubmit} className="stack">
            <div className="form-row field-row">
              <label htmlFor="name">Name</label>
              <div className="input-with-btn">
                <input
                  id="name"
                  type="text"
                  placeholder="Enter a route name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <LocationInput
              label="Origin"
              value={origin.value}
              onChange={(next) => handleLocationValueChange("origin", next)}
              onCoordsChange={(coords, label) => handleLocationCoordsChange("origin", coords, label)}
              onRequestSavedPlaces={() => openSavedModal("origin")}
              externalError={origin.error}
              placeholder="Enter a place or coordinates"
            />

            <LocationInput
              label="Destination"
              value={destination.value}
              onChange={(next) => handleLocationValueChange("destination", next)}
              onCoordsChange={(coords, label) => handleLocationCoordsChange("destination", coords, label)}
              onRequestSavedPlaces={() => openSavedModal("destination")}
              externalError={destination.error}
              placeholder="Enter a place or coordinates"
            />

            <div className="form-row">
              <label>Mobility method</label>
              <MobilitySelector value={mobility} onChange={(v) => { setMobility(v); invalidatePreview(); }} />

              <SelectVehicle
                mobility={mobility}
                value={selectedVehicle}
                onChange={(v) => { setSelectedVehicle(v); invalidatePreview(); }}
                fetchVehicles={fetchVehiclesForMode}
              />
            </div>

            <div className="form-row">
              <label htmlFor="routeType">Route type</label>
              <RouteTypeSelector id="routeType" value={routeType} onChange={(v) => { setRouteType(v); invalidatePreview(); }} />
            </div>

            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.4rem" }}>
              <button type="submit" className="btn btn-primary" disabled={vmLoading || saving}>
                {primaryButtonLabel}
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        )}

        <SavedPlacesModal
          open={showSavedModal}
          onSelect={selectSavedPlace}
          onClose={closeSavedModal}
        />
      </aside>

      <main className="map-panel">
        <LeafletMap
          center={center}
          zoom={13}
          markers={markers}
          polyline={polyline}
          onMapClick={(coords) => {
            const [lat, lng] = coords;
            setError("");
            if (!origin.coords) {
              handleLocationCoordsChange("origin", [lat, lng], formatLatLng([lat, lng]));
              fetchToponymForCoords("origin", [lat, lng]);
            } else if (!destination.coords) {
              handleLocationCoordsChange("destination", [lat, lng], formatLatLng([lat, lng]));
              fetchToponymForCoords("destination", [lat, lng]);
            } else {
              handleLocationCoordsChange("origin", [lat, lng], formatLatLng([lat, lng]));
              fetchToponymForCoords("origin", [lat, lng]);
              mutateLocation("destination", () => createLocationState());
            }
          }}
          style={{ minHeight: 520 }}
        />
      </main>
    </section>
  );
}
