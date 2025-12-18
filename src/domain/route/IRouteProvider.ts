import { Route } from "../model/Route";

// Interfaz estándar que toda API de rutas debe implementar
export interface IRouteProvider {
  getRoute(
    origin: string,
    destination: string,
    mobilityType: string,
    routeType: string
  ): Promise<Route>;
}
