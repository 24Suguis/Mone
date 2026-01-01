import { type IRouteProvider } from "../../domain/route/IRouteProvider";
import { Route } from "../../domain/model/Route";
export class OpenRouteServiceAdapter implements IRouteProvider {
  constructor(private api: any) {}

  async getRoute(origin: string, destination: string, mobilityType: string, routeType: string): Promise<Route> {
    const response = await this.api.getRoute(origin, destination, mobilityType, routeType);
    const dto = await response.json();

    const feature = dto?.features?.[0];
    const segment = feature?.properties?.segments?.[0] ?? { distance: 0, duration: 0, steps: [] };
    const distance = Number(segment.distance) || 0; // meters
    const duration = Number(segment.duration) / 60 || 0; // minutes
    const steps = Array.isArray(segment.steps) ? segment.steps.map((s: any) => s.instruction).filter(Boolean) : [];

    const rawCoords = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
    const polyline = rawCoords
      .map((point: any) => {
        if (!Array.isArray(point) || point.length < 2) return null;
        const [lng, lat] = point;
        const latNum = Number(lat);
        const lngNum = Number(lng);
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
        return [latNum, lngNum] as [number, number];
      })
      .filter((value): value is [number, number] => Boolean(value));

    return new Route({
      origin,
      destination,
      distanceMeters: distance,
      durationMinutes: duration,
      mobilityType,
      routeType,
      steps,
      polyline,
    });
  }
}
