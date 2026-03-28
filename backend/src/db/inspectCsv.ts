import fs from "node:fs";
import path from "node:path";
import csv from "csv-parser";

async function inspectFile(filename: string) {
  return new Promise<void>((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const fullPath = path.join(__dirname, filename);

    if (!fs.existsSync(fullPath)) {
      reject(new Error(`File not found: ${fullPath}`));
      return;
    }

    fs.createReadStream(fullPath)
      .pipe(csv())
      .on("headers", (headers: string[]) => {
        console.log(`\n${filename} - Detected columns:`);
        console.log(headers);
      })
      .on("data", (row: Record<string, string>) => {
        if (rows.length < 5) {
          rows.push(row);
          console.log("Sample row:", JSON.stringify(row, null, 2));
        }
      })
      .on("end", () => resolve())
      .on("error", reject);
  });
}

async function main() {
  await inspectFile("fare.csv");
  await inspectFile("routeTimetable.csv");
  console.log("\nInspection complete. Check column names above.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
