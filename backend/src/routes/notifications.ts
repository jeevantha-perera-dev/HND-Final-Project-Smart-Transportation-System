import { Router } from "express";
import { collections } from "../db/collections";
import { firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { toDate } from "../lib/firestoreUtils";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const snap = await firestore
      .collection(collections.passengerAnnouncements)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const items = snap.docs.map((d) => {
      const data = d.data();
      const created = toDate(data.createdAt);
      return {
        id: d.id,
        title: String(data.title ?? ""),
        body: String(data.body ?? ""),
        category: String(data.category ?? "General"),
        important: Boolean(data.important),
        createdAt: created.toISOString(),
      };
    });

    res.json({ items });
  })
);
