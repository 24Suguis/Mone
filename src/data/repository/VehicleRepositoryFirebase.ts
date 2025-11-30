
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
import type { VehicleRepositoryInterface } from "../../domain/repository/VehicleRepositoryInterface";

const db = getFirestore(firebaseApp);

export class VehicleRepositoryFirebase implements VehicleRepositoryInterface {
    private vehicleCollection = collection(db, "vehicles");

    
    
    async deleteVehicle(ownerId: string, vehicleName: string): Promise<void> {
        const q = query(this.vehicleCollection, where("ownerId", "==", ownerId), where("name", "==", vehicleName));
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error("VehicleNotFoundException");
        
        snapshot.docs.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });
    }


}

