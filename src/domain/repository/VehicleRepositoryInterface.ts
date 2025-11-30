import type { Vehicle } from '../model/VehicleInterface';


export interface VehicleRepositoryInterface {
    saveVehicle(userId: string, vehicle: Vehicle): Promise<void>;

}