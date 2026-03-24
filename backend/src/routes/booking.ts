import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { collections } from "../db/collections";
import { firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { toDate, toIso, toNumber } from "../lib/firestoreUtils";
import { requireAuth } from "../lib/auth";
import { HttpError } from "../lib/httpError";

const seatLockSchema = z.object({
  tripId: z.string().min(1),
  seatId: z.string().min(1),
  amount: z.number().positive(),
});

const confirmSchema = z.object({
  bookingId: z.string().min(1),
});

export const bookingRouter = Router();

bookingRouter.post(
  "/seat-lock",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = seatLockSchema.parse(req.body);
    const bookingId = randomUUID();
    const lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const seatKey = `${payload.tripId}_${payload.seatId}`;

    await firestore.runTransaction(async (tx) => {
      const tripRef = firestore.collection(collections.trips).doc(payload.tripId);
      const tripSnap = await tx.get(tripRef);
      if (!tripSnap.exists) throw new HttpError(404, "Trip not found");

      const seatIndexRef = firestore.collection(collections.bookingIndex).doc(seatKey);
      const seatIndex = await tx.get(seatIndexRef);
      if (seatIndex.exists) {
        const seatData = seatIndex.data();
        if (seatData?.status !== "CANCELLED") throw new HttpError(409, "Seat already reserved");
      }

      const bookingRef = firestore.collection(collections.bookings).doc(bookingId);
      tx.set(bookingRef, {
        id: bookingId,
        userId: req.auth!.userId,
        tripId: payload.tripId,
        seatId: payload.seatId,
        status: "PENDING",
        totalAmount: payload.amount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      tx.set(firestore.collection(collections.seatLocks).doc(bookingId), {
        id: bookingId,
        bookingId,
        status: "ACTIVE",
        expiresAt: lockExpiresAt,
        createdAt: new Date().toISOString(),
      });

      tx.set(seatIndexRef, {
        seatKey,
        bookingId,
        status: "PENDING",
        updatedAt: new Date().toISOString(),
      });
    });

    res.status(201).json({
      bookingId,
      expiresAt: lockExpiresAt,
    });
  })
);

bookingRouter.post(
  "/confirm",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = confirmSchema.parse(req.body);
    const bookingRef = firestore.collection(collections.bookings).doc(payload.bookingId);
    const lockRef = firestore.collection(collections.seatLocks).doc(payload.bookingId);
    const ticketRef = firestore.collection(collections.tickets).doc(payload.bookingId);

    const result = await firestore.runTransaction(async (tx) => {
      const bookingSnap = await tx.get(bookingRef);
      if (!bookingSnap.exists) throw new HttpError(404, "Booking not found");
      const booking = bookingSnap.data()!;
      if (booking.userId !== req.auth!.userId) throw new HttpError(404, "Booking not found");

      const lockSnap = await tx.get(lockRef);
      if (!lockSnap.exists) throw new HttpError(400, "Seat lock expired");
      const lock = lockSnap.data()!;
      if (toDate(lock.expiresAt) < new Date()) throw new HttpError(400, "Seat lock expired");

      const walletRef = firestore.collection(collections.wallets).doc(req.auth!.userId);
      const walletSnap = await tx.get(walletRef);
      if (!walletSnap.exists) throw new HttpError(404, "Wallet not found");

      const wallet = walletSnap.data()!;
      const balance = toNumber(wallet.balance);
      const amount = toNumber(booking.totalAmount);
      if (balance < amount) throw new HttpError(400, "Insufficient wallet balance");

      const tripRef = firestore.collection(collections.trips).doc(String(booking.tripId));
      const tripSnap = await tx.get(tripRef);
      if (!tripSnap.exists) throw new HttpError(404, "Trip not found");
      const trip = tripSnap.data()!;
      const seatsAvailable = toNumber(trip.seatsAvailable);
      if (seatsAvailable <= 0) throw new HttpError(400, "No seats available");

      tx.set(
        bookingRef,
        {
          status: "CONFIRMED",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      tx.set(lockRef, { status: "CONSUMED" }, { merge: true });
      tx.set(ticketRef, {
        id: payload.bookingId,
        bookingId: payload.bookingId,
        qrCode: `QR-${payload.bookingId}`,
        issuedAt: new Date().toISOString(),
      });
      tx.set(
        walletRef,
        {
          balance: Number((balance - amount).toFixed(2)),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      const walletTxnRef = firestore.collection(collections.walletTransactions).doc(randomUUID());
      tx.set(walletTxnRef, {
        id: walletTxnRef.id,
        walletId: req.auth!.userId,
        type: "PAYMENT",
        amount: Number((-amount).toFixed(2)),
        reference: `booking:${payload.bookingId}`,
        createdAt: new Date().toISOString(),
      });
      tx.set(
        tripRef,
        {
          seatsAvailable: seatsAvailable - 1,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      const seatKey = `${booking.tripId}_${booking.seatId}`;
      const seatIndexRef = firestore.collection(collections.bookingIndex).doc(seatKey);
      tx.set(seatIndexRef, { status: "CONFIRMED", bookingId: payload.bookingId }, { merge: true });

      return {
        id: payload.bookingId,
        ...booking,
        status: "CONFIRMED",
      };
    });

    res.json({ booking: result, status: "confirmed" });
  })
);

bookingRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const bookingsSnap = await firestore
      .collection(collections.bookings)
      .where("userId", "==", req.auth!.userId)
      .orderBy("createdAt", "desc")
      .get();

    const items = await Promise.all(
      bookingsSnap.docs.map(async (doc) => {
        const booking = doc.data();
        const tripSnap = await firestore.collection(collections.trips).doc(String(booking.tripId)).get();
        const ticketSnap = await firestore.collection(collections.tickets).doc(doc.id).get();
        return {
          id: doc.id,
          ...booking,
          createdAt: toIso(booking.createdAt),
          updatedAt: toIso(booking.updatedAt),
          trip: tripSnap.exists ? tripSnap.data() : null,
          ticket: ticketSnap.exists ? ticketSnap.data() : null,
        };
      })
    );

    res.json({ items });
  })
);
