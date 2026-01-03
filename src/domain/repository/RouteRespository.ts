export interface RouteSavedDTO {
	id?: string;
	name?: string;
	origin: string;
	destination: string;
	originLabel?: string;
	destinationLabel?: string;
	mobilityType: string;
	mobilityMethod: string;
	routeType: string;
	createdAt?: Date;
}

export interface RouteRepository {
	saveRoute(userId: string, payload: RouteSavedDTO): Promise<string>;
	listRoutes(userId: string): Promise<RouteSavedDTO[]>;
	deleteRoute(userId: string, routeId: string): Promise<void>;
	getRoute(userId: string, routeId: string): Promise<RouteSavedDTO | null>;
	updateRoute(userId: string, routeId: string, payload: RouteSavedDTO): Promise<void>;
}
