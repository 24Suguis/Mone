

export interface VehicleRepositoryInterface {
    deleteVehicle(ownerId: string, vehicleName: string): Promise<void>;
}
