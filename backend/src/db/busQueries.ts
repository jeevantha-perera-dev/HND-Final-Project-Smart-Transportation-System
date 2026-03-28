import { firestore } from "./firestore";

export async function findRoutes(origin: string, destination: string) {
  const snap = await firestore
    .collection("routes")
    .where("origin", "==", origin)
    .where("destination", "==", destination)
    .orderBy("departureTime")
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getFare(routeId: string, passengerType = "Adult") {
  const snap = await firestore
    .collection("fares")
    .where("routeId", "==", routeId)
    .where("passengerType", "==", passengerType)
    .limit(1)
    .get();

  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}
