import { useCallback, useRef, useState } from "react";
import { RouteFacade, type RouteResponse } from "../domain/service/RouteFacade";
import type { Vehicle } from "../domain/model/VehicleInterface";

const getRouteFacade = (() => {
	let instance: RouteFacade | null = null;
	return (): RouteFacade => {
		if (!instance) {
			instance = new RouteFacade();
		}
		return instance;
	};
})();

export interface RouteSearchOptions {
	origin: string;
	destination: string;
	mobilityType: string;
	routeType: string;
	userId?: string;
	name?: string;
	save?: boolean;
	vehicle?: Vehicle;
}

export interface RouteViewmodelState {
	loading: boolean;
	error: string | null;
	result: RouteResponse | null;
	searchRoute: (options: RouteSearchOptions) => Promise<RouteResponse>;
	reset: () => void;
}

const sanitizeValue = (value?: string | null): string => value?.trim() ?? "";

export const useRouteViewmodel = (): RouteViewmodelState => {
	const facadeRef = useRef<RouteFacade>();
	const facade = facadeRef.current ?? (facadeRef.current = getRouteFacade());

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<RouteResponse | null>(null);

	const reset = useCallback(() => {
		setError(null);
		setResult(null);
	}, []);

	const searchRoute = useCallback(
		async (options: RouteSearchOptions): Promise<RouteResponse> => {
			const origin = sanitizeValue(options.origin);
			const destination = sanitizeValue(options.destination);
			const mobilityType = sanitizeValue(options.mobilityType) || "vehicle";
			const routeType = sanitizeValue(options.routeType) || "fastest";
			const userId = sanitizeValue(options.userId ?? undefined) || undefined;
			const shouldSave = options.save === true && Boolean(options.name);
			const routeName = sanitizeValue(options.name);

			const createDefaultVehicle = (mode: string): Vehicle => {
				switch (mode) {
					case "bike":
						return {
							name: "Bicycle (default)",
							fuelType: null,
							consumption: { amount: 6.0, unit: "kcal/min" },
							type: "Bike",
							mostrarInfo: () => {},
						};
					case "walk":
						return {
							name: "Walking (default)",
							fuelType: null,
							consumption: { amount: 4.5, unit: "kcal/min" },
							type: "Walking",
							mostrarInfo: () => {},
						};
					case "vehicle":
					default:
						return {
							name: "Default car",
							fuelType: "gasoline",
							consumption: { amount: 6.5, unit: "l/100km" },
							type: "FuelCar",
							mostrarInfo: () => {},
						};
				}
			};

			const vehicleToUse: Vehicle | undefined = options.vehicle ?? createDefaultVehicle(mobilityType);

			if (!origin) throw new Error("Origin is required");
			if (!destination) throw new Error("Destination is required");

			setLoading(true);
			setError(null);

			try {
				const basePayload = {
					origin,
					destination,
					mobilityType,
					routeType,
					userId,
				} as const;

				const response = shouldSave
					? await facade.requestAndSaveRoute({ ...basePayload, name: routeName }, vehicleToUse)
					: await facade.requestRoute(basePayload, vehicleToUse);

				setResult(response);
				return response;
			} catch (err) {
				const message = err instanceof Error ? err.message : "Unable to request route";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[facade]
	);

	return {
		loading,
		error,
		result,
		searchRoute,
		reset,
	};
};
