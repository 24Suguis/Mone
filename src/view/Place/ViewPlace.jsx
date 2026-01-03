import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LeafletMap from "../components/LeafletMap.jsx";
import { placeViewmodel } from "../../viewmodel/placeViewmodel";
import BackButton from "../components/BackButton";

const DEFAULT_CENTER = [39.99256, -0.067387];

export default function ViewPlace() {
  const { placeId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [place, setPlace] = useState(null);
  const [coords, setCoords] = useState(DEFAULT_CENTER);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/places");
    }
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      if (!placeId) {
        setError("Invalid place identifier.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await placeViewmodel.getPlace(placeId);
        if (!data) {
          setError("Place not found or you do not have access to it.");
          return;
        }
        setPlace(data);
        const lat = Number(data.latitude);
        const lng = Number(data.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setCoords([lat, lng]);
        } else {
          setCoords(DEFAULT_CENTER);
        }
        setError("");
      } catch (err) {
        setError(err?.message || "Unable to load this place.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [placeId]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="default-container with-border" style={{ textAlign: "center" }}>
          Loading place data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div className="default-container with-border" style={{ textAlign: "center" }}>
          <p className="error-text" style={{ marginBottom: "0.75rem" }}>{error}</p>
          <button type="button" className="btn btn-secondary" onClick={handleBack}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const lat = Number(place?.latitude);
  const lng = Number(place?.longitude);

  return (
    <section className="place-row">
      <aside className="place-card default-container with-border">
        <BackButton label="Back" style={{ marginBottom: "0.25rem" }} />
        <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="card-title">Place</h2>
        </div>

        <form className="stack">
          <div className="form-row">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={place?.name || "Unnamed place"}
              disabled
              readOnly
            />
          </div>

          <div className="form-row">
            <label htmlFor="toponym">Toponym</label>
            <input
              id="toponym"
              type="text"
              value={place?.toponymicAddress || ""}
              disabled
              readOnly
              placeholder="No toponym"
            />
          </div>

          <div className="form-row">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              type="text"
              value={place?.description || ""}
              disabled
              readOnly
              placeholder="No description"
            />
          </div>

          <div className="form-row">
            <label htmlFor="coords">Coordinates</label>
            <input
              id="coords"
              type="text"
              value={Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : ""}
              disabled
              readOnly
              placeholder="No coordinates"
            />
          </div>
        </form>
      </aside>

      <main className="map-panel">
        <LeafletMap
          center={coords}
          zoom={13}
          markers={[coords]}
          polyline={[]}
          autoFitBounds={false}
          style={{ minHeight: 420 }}
        />
      </main>
    </section>
  );
}
