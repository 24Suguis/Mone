import { addDoc, collection, deleteDoc, doc, getDocs, limit as fsLimit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../../core/config/firebaseConfig";
import { type RouteRepository, type RouteSavedDTO } from "../../domain/repository/RouteRespository";

const userRoutesCollection = (userId: string) => {
  if (!userId) throw new Error("User id is required to access routes");
  return collection(db, "users", userId, "routes");
};

export class RouteRepositoryFirebase implements RouteRepository {
  async saveRoute(userId: string, payload: RouteSavedDTO): Promise<string> {
    const routeName = payload.name?.trim();
    if (!routeName) {
      throw new Error("Route name is required when saving a request");
    }
    const ref = await addDoc(userRoutesCollection(userId), {
      name: routeName,
      origin: payload.origin,
      destination: payload.destination,
      mobilityType: payload.mobilityType,
      routeType: payload.routeType,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async listRoutes(userId: string): Promise<RouteSavedDTO[]> {
    const q = query(userRoutesCollection(userId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        origin: data.origin,
        destination: data.destination,
        mobilityType: data.mobilityType,
        routeType: data.routeType,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      };
    });
  }

  async deleteRoute(userId: string, routeId: string): Promise<void> {
    if (!routeId) throw new Error("Route id is required");
    await deleteDoc(doc(userRoutesCollection(userId), routeId));
  }
}
