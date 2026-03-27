import { firestore } from "./firestore";

async function main() {
  const ref = firestore.collection("routes").doc("debug_test_write");
  await ref.set({
    ping: "ok",
    createdAt: new Date().toISOString(),
  });
  console.log("write ok");
  await ref.delete();
  console.log("cleanup ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
