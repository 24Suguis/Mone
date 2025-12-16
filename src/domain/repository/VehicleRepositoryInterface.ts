import type { Vehicle } from '../model/VehicleInterface';


export interface VehicleRepositoryInterface {
    saveVehicle(userId: string, vehicle: Vehicle): Promise<void>;
    getVehiclesByOwnerId(ownerId: string): Promise<Vehicle[]>;
    deleteVehicle(ownerId: string, vehicleName: string): Promise<void>;


}


