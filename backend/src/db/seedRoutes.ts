import fs from "node:fs";
import path from "node:path";
import csv from "csv-parser";
import { firestore } from "./firestore";
import { FareDocument, mapFareRow, mapRouteRow, RouteDocument } from "./columnMapper";

const BATCH_SIZE = 400;
const ROUTES_CSV = path.join(__dirname, "routeTimetable.csv");
const FARES_CSV = path.join(__dirname, "fare.csv");
const DRY_RUN = process.argv.includes("--dry-run");
const CLEAR_FIRST = process.argv.includes("--clear");
const FIRESTORE_OP_TIMEOUT_MS = 20000;

function toSafeDocId(value: string) {
  return value
    .trim()
    .replace(/[\/\\]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^\w.-]/g, "_");
}

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = FIRESTORE_OP_TIMEOUT_MS): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

function readCsv<T>(filePath: string, mapper: (row: Record<string, string>, index: number) => T): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const output: T[] = [];
    let rowIndex = 0;

    if (!fs.existsSync(filePath)) {
      reject(new Error(`File not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row: Record<string, string>) => {
        try {
          rowIndex += 1;
          output.push(mapper(row, rowIndex));
        } catch (error) {
          console.warn(`Skipping row ${rowIndex} due to mapping error:`, error);
        }
      })
      .on("end", () => resolve(output))
      .on("error", reject);
  });
}

async function clearCollection(collectionName: string) {
  console.log(`Clearing collection: ${collectionName}...`);
  const snap = await withTimeout(firestore.collection(collectionName).get(), `Read collection ${collectionName}`);
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
    await withTimeout(batch.commit(), `Delete batch in ${collectionName}`);
  }
  console.log(`   Deleted ${count} documents.`);
}

async function seedCollection<T extends object>(collectionName: string, records: T[], getDocId?: (record: T) => string) {
  console.log(`\nSeeding "${collectionName}" — ${records.length} records...`);

  if (DRY_RUN) {
    console.log("   DRY RUN sample:");
    console.log(JSON.stringify(records[0], null, 2));
    console.log(`   Would write ${records.length} docs.`);
    return;
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const batch = firestore.batch();
    for (const record of chunk) {
      const docRef = getDocId ? firestore.collection(collectionName).doc(getDocId(record)) : firestore.collection(collectionName).doc();
      batch.set(docRef, record, { merge: true });
    }
    try {
      await withTimeout(batch.commit(), `Write batch ${Math.floor(i / BATCH_SIZE) + 1} in ${collectionName}`);
      success += chunk.length;
      const pct = Math.round((success / records.length) * 100);
      process.stdout.write(`\r   Progress: ${success}/${records.length} (${pct}%)`);
    } catch (error) {
      failed += chunk.length;
      console.error(`\n   Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
    }
  }

  console.log(`\n   Done. Success: ${success} | Errors: ${failed}`);
}

function validateRoutes(routes: RouteDocument[]): RouteDocument[] {
  const valid: RouteDocument[] = [];
  const skipped: number[] = [];

  for (const route of routes) {
    if (!route.routeId) {
      skipped.push(route.sourceRow);
      continue;
    }
    if (!route.origin || !route.destination) {
      console.warn(`Row ${route.sourceRow}: missing origin/destination, keeping row.`);
    }
    valid.push(route);
  }

  if (skipped.length > 0) {
    console.warn(`Skipped ${skipped.length} rows with no routeId: ${skipped.join(", ")}`);
  }

  return valid;
}

function validateFares(fares: FareDocument[]): FareDocument[] {
  return fares.filter((fare) => {
    if (!fare.routeId) {
      console.warn(`Row ${fare.sourceRow}: fare has no routeId, skipping.`);
      return false;
    }
    if (fare.fareAmount <= 0) {
      console.warn(`Row ${fare.sourceRow}: fare amount is invalid (${fare.fareAmount}).`);
    }
    return true;
  });
}

function printSummary(routes: RouteDocument[], fares: FareDocument[]) {
  const expressCount = routes.filter((route) => route.isExpress).length;
  const acCount = routes.filter((route) => route.isAC).length;
  const uniqueOrigins = new Set(routes.map((route) => route.origin)).size;
  const avgFare = fares.length ? (fares.reduce((acc, fare) => acc + fare.fareAmount, 0) / fares.length).toFixed(2) : "N/A";

  console.log("\n======================");
  console.log("SEED SUMMARY");
  console.log("======================");
  console.log(`Routes total:     ${routes.length}`);
  console.log(`  Express routes: ${expressCount}`);
  console.log(`  AC routes:      ${acCount}`);
  console.log(`  Unique origins: ${uniqueOrigins}`);
  console.log(`Fares total:      ${fares.length}`);
  console.log(`  Avg fare (LKR): ${avgFare}`);
  console.log(`Mode:             ${DRY_RUN ? "DRY RUN" : "LIVE WRITE"}`);
  console.log("======================\n");
}

async function main() {
  if (!DRY_RUN) {
    console.log("\nChecking Firestore connectivity...");
    await withTimeout(firestore.collection("__health").limit(1).get(), "Firestore health check read");
    console.log("  Firestore reachable.");
  }

  console.log("\nSmartBusApp Database Seeder");
  console.log("===========================");
  if (DRY_RUN) console.log("DRY RUN mode enabled.");
  if (CLEAR_FIRST) console.log("CLEAR mode enabled.");

  console.log("\nReading CSV files...");
  const [rawRoutes, rawFares] = await Promise.all([readCsv(ROUTES_CSV, mapRouteRow), readCsv(FARES_CSV, mapFareRow)]);
  console.log(`  routeTimetable.csv -> ${rawRoutes.length} rows`);
  console.log(`  fare.csv           -> ${rawFares.length} rows`);

  console.log("\nValidating...");
  const routes = validateRoutes(rawRoutes);
  const fares = validateFares(rawFares);
  printSummary(routes, fares);

  if (CLEAR_FIRST && !DRY_RUN) {
    await clearCollection("routes");
    await clearCollection("fares");
  }

  await seedCollection("routes", routes, (route) => `route_${toSafeDocId(route.routeId)}`);
  await seedCollection("fares", fares, (fare) =>
    `fare_${toSafeDocId(fare.routeId)}_${toSafeDocId(fare.origin)}_${toSafeDocId(fare.destination)}`
  );

  console.log("\nSeeding complete.\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
