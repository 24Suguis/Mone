import type { ConsumptionUnit, DistanceUnit } from "../model/IRouteData";

export function normalizeConsumptionUnit(raw?: string | null): ConsumptionUnit | null {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  // common variants -> canonical slash style
  if (v === "l/100km" || v === "l_per_100km" || v === "l_per_100 km" || v === "l per 100km") return "l/100km";
  if (v === "kwh/100km" || v === "kwh_per_100km" || v === "kwh_per_100 km" || v === "kwh per 100km") return "kwh/100km";
  if (v === "km/l" || v === "km_per_l" || v === "km per l") return "km/l";
  if (v === "km/kwh" || v === "km_per_kwh" || v === "km per kwh") return "km/kwh";
  if (v === "kcal/min" || v === "kcal_per_min") return "kcal/min";
  return null;
}

export function canonicalizeConsumption(
  value?: number | null,
  unit?: string | null
): { value: number; unit: ConsumptionUnit } | null {
  const u = normalizeConsumptionUnit(unit ?? null);
  if (value == null || u == null) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  switch (u) {
    case "km/l":
      return { value: 100 / value, unit: "l/100km" };
    case "km/kwh":
      return { value: 100 / value, unit: "kwh/100km" };
    case "l/100km":
    case "kwh/100km":
      return { value, unit: u };
    case "kcal/min":
      return { value, unit: "kcal/min" };
    default:
      return null;
  }
}

export function distanceToKm(distance: number, unit: DistanceUnit): number {
  if (!Number.isFinite(distance)) return NaN;
  switch (unit) {
    case "m":
      return distance / 1000;
    case "km":
      return distance;
    case "mi":
      return distance * 1.60934;
    default:
      return distance;
  }
}
