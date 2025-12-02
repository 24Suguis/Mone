
import {
    getFirestore,
    doc,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { firebaseApp } from "../../core/config/firebaseConfig";
import { type Vehicle } from "../../domain/model/VehicleInterface";
import type { VehicleRepositoryInterface } from "../../domain/repository/VehicleRepositoryInterface";

const db = getFirestore(firebaseApp);

export class VehicleRepositoryFirebase implements VehicleRepositoryInterface {
    private vehicleCollection = collection(db, "vehicles");

    //guardar un vehiculo 
   async saveVehicle(ownerId: string, vehicle: Vehicle): Promise<void> {
        await addDoc(this.vehicleCollection, {
            ownerId,
            name: vehicle.name,
            fuelType: vehicle.fuelType,
            consumption: vehicle.consumption,
            createdAt: serverTimestamp(),
        });
    }
}

