import { firestore } from "./firestore";
import { collections } from "./collections";

const DRY_RUN = process.argv.includes("--dry-run");
const CLEAR_FIRST = process.argv.includes("--clear");
const DAYS_ARG = process.argv.find((a) => a.startsWith("--days="));
const DAYS = DAYS_ARG ? Math.max(1, Math.min(30, Number.parseInt(DAYS_ARG.split("=")[1] ?? "14", 10) || 14)) : 14;
const BATCH_SIZE = 400;
const DEFAULT_FARE_LKR = 150;

function toSafeDocId(value: string) {
  return value
    .trim()
    .replace(/[\/\\]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "_");
}

function colomboYmd(offsetDays: number): string {
  const t = Date.now() + offsetDays * 24 * 60 * 60 * 1000;
  return new Date(t).toLocaleDateString("sv-SE", { timeZone: "Asia/Colombo" });
}

function parseHHMM(raw: string): { h: number; m: number } | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return { h, m };
}

function colomboLocalToIso(ymd: string, h: number, m: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(`${ymd}T${pad(h)}:${pad(m)}:00+05:30`).toISOString();
}

async function clearTrips() {
  console.log("Clearing collection: trips...");
  const snap = await firestore.collection(collections.trips).get();
  if (snap.empty) {
    console.log("   Already empty.");
    return;
  }
  let count = 0;
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const chunk = snap.docs.slice(i, i + BATCH_SIZE);
    const batch = firestore.batch();
    for (const doc of chunk) {
      batch.delete(doc.ref);
      count += 1;
    }
    await batch.commit();
  }
  console.log(`   Deleted ${count} documents.`);
}

async function main() {
  console.log("\nSeed bookable trips (Sri Lanka / LKR)");
  console.log(`  days=${DAYS} dryRun=${DRY_RUN} clear=${CLEAR_FIRST}`);

  if (CLEAR_FIRST && !DRY_RUN) {
    await clearTrips();
  }

  const [routesSnap, faresSnap] = await Promise.all([
    firestore.collection("routes").get(),
    firestore.collection("fares").get(),
  ]);

  const fareByRoute = new Map<string, number>();
  for (const doc of faresSnap.docs) {
    const f = doc.data();
    const routeId = String(f.routeId ?? "");
    const amount = typeof f.fareAmount === "number" ? f.fareAmount : Number(f.fareAmount);
    if (!routeId || !Number.isFinite(amount) || amount <= 0) continue;
    const prev = fareByRoute.get(routeId);
    if (prev === undefined || amount < prev) fareByRoute.set(routeId, amount);
  }

  const now = Date.now();
  const writes: { id: string; data: Record<string, unknown> }[] = [];

  for (const doc of routesSnap.docs) {
    const route = doc.data();
    const routeId = String(route.routeId ?? "");
    if (!routeId) continue;

    const routeName = String(route.routeName ?? `${route.origin ?? ""} – ${route.destination ?? ""}`);
    const origin = String(route.origin ?? "Origin");
    const destination = String(route.destination ?? "Destination");
    const departureTime = String(route.departureTime ?? "06:00");
    const hm = parseHHMM(departureTime);
    if (!hm) {
      console.warn(`  Skip route ${routeId}: bad departureTime "${departureTime}"`);
      continue;
    }

    const durationMinutes =
      typeof route.durationMinutes === "number"
        ? route.durationMinutes
        : Number.parseFloat(String(route.durationMinutes ?? "45")) || 45;
    const isExpress = Boolean(route.isExpress);
    const baseFare = fareByRoute.get(routeId) ?? DEFAULT_FARE_LKR;
    const seatsAvailable = 45;
    const shortRouteId = String(route.shortRouteId ?? "").trim();

    for (let d = 0; d < DAYS; d += 1) {
      const ymd = colomboYmd(d);
      const departureAt = colomboLocalToIso(ymd, hm.h, hm.m);
      if (new Date(departureAt).getTime() < now - 60_000) continue;

      const depMs = new Date(departureAt).getTime();
      const arrivalAt = new Date(depMs + durationMinutes * 60_000).toISOString();
      const docId = `trip_${toSafeDocId(routeId)}_${ymd.replace(/-/g, "")}_${String(hm.h).padStart(2, "0")}${String(hm.m).padStart(2, "0")}`;

      const nowIso = new Date().toISOString();
      writes.push({
        id: docId,
        data: {
          id: docId,
          routeId,
          routeCode: routeId,
          ...(shortRouteId ? { shortRouteId } : {}),
          routeName,
          isExpress,
          vehicleId: `BUS-${toSafeDocId(routeId)}`,
          vehicleCode: `BUS-${toSafeDocId(routeId)}`,
          driverId: "",
          originStopCode: origin.trim().toUpperCase().replace(/\s+/g, "-"),
          destinationStopCode: destination.trim().toUpperCase().replace(/\s+/g, "-"),
          originStopName: origin,
          destinationStopName: destination,
          departureAt,
          arrivalAt,
          baseFare,
          seatsAvailable,
          status: "scheduled",
          notes: null,
          createdAt: nowIso,
          updatedAt: nowIso,
        },
      });
    }
  }

  console.log(`  Prepared ${writes.length} trip documents.`);

  if (DRY_RUN) {
    console.log("  DRY RUN — sample:", JSON.stringify(writes[0]?.data, null, 2));
    return;
  }

  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const chunk = writes.slice(i, i + BATCH_SIZE);
    const batch = firestore.batch();
    for (const w of chunk) {
      const ref = firestore.collection(collections.trips).doc(w.id);
      batch.set(ref, w.data, { merge: true });
    }
    await batch.commit();
    process.stdout.write(`\r  Written ${Math.min(i + chunk.length, writes.length)}/${writes.length}`);
  }
  console.log("\n  Done.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
