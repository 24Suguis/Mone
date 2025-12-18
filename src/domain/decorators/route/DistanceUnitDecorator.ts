import { type DistanceUnit, type IRouteData } from "../../model/IRouteData";
import { RouteDecorator } from "./RouteDecorator";

export class DistanceUnitDecorator extends RouteDecorator {
  constructor(route: IRouteData, private readonly preferredUnit: DistanceUnit) {
    super(route);
  }

  getDistance(): number {
    const baseMeters = this.route.getDistance();
    switch (this.preferredUnit) {
      case "km":
        return baseMeters / 1000;
      case "mi":
        return baseMeters / 1609.344;
      default:
        return baseMeters;
    }
  }

  getDistanceUnit(): DistanceUnit {
    return this.preferredUnit;
  }
}
