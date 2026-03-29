import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { collections } from "../db/collections";
import { firestore } from "../db/firestore";
import { asyncHandler } from "../lib/asyncHandler";
import { toDate, toIso, toNumber } from "../lib/firestoreUtils";
import { requireAuth } from "../lib/auth";
import { HttpError } from "../lib/httpError";

const topupSchema = z.object({
  amount: z.number().positive().max(5000),
});

const transferSchema = z.object({
  toUserEmail: z.string().email(),
  amount: z.number().positive().max(1000),
});

export const walletRouter = Router();

walletRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const walletSnap = await firestore.collection(collections.wallets).doc(req.auth!.userId).get();
    if (!walletSnap.exists) throw new HttpError(404, "Wallet not found");
    const wallet = walletSnap.data()!;

    res.json({
      id: String(wallet.id ?? req.auth!.userId),
      balance: toNumber(wallet.balance),
      transitPoints: toNumber(wallet.transitPoints),
      rewards: Array.isArray(wallet.rewards) ? wallet.rewards : [],
      vouchers: Array.isArray(wallet.vouchers) ? wallet.vouchers : [],
    });
  })
);

walletRouter.get(
  "/history",
  requireAuth,
  asyncHandler(async (req, res) => {
    const walletSnap = await firestore.collection(collections.wallets).doc(req.auth!.userId).get();
    if (!walletSnap.exists) throw new HttpError(404, "Wallet not found");
    // Equality-only query avoids a composite index (walletId + createdAt). Sort newest-first in memory.
    const querySnap = await firestore
      .collection(collections.walletTransactions)
      .where("walletId", "==", req.auth!.userId)
      .get();
    const items = querySnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          amount: toNumber(data.amount),
          createdAt: toIso(data.createdAt),
          _sortMs: toDate(data.createdAt).getTime(),
        };
      })
      .sort((a, b) => b._sortMs - a._sortMs)
      .slice(0, 100)
      .map(({ _sortMs: _ignored, ...row }) => row);
    res.json({ items });
  })
);

walletRouter.post(
  "/topup",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = topupSchema.parse(req.body);
    const walletRef = firestore.collection(collections.wallets).doc(req.auth!.userId);

    await firestore.runTransaction(async (tx) => {
      const walletSnap = await tx.get(walletRef);
      if (!walletSnap.exists) throw new HttpError(404, "Wallet not found");
      const current = toNumber(walletSnap.data()?.balance);
      const next = Number((current + payload.amount).toFixed(2));
      tx.set(walletRef, { balance: next, updatedAt: new Date().toISOString() }, { merge: true });

      const txRef = firestore.collection(collections.walletTransactions).doc(randomUUID());
      tx.set(txRef, {
        id: txRef.id,
        walletId: req.auth!.userId,
        type: "TOPUP",
        amount: payload.amount,
        reference: "wallet-topup",
        createdAt: new Date().toISOString(),
      });
    });

    const refreshed = await walletRef.get();
    res.json({
      status: "ok",
      balance: toNumber(refreshed.data()?.balance),
    });
  })
);

walletRouter.post(
  "/transfer",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = transferSchema.parse(req.body);
    const receiverQuery = await firestore
      .collection(collections.users)
      .where("email", "==", payload.toUserEmail.toLowerCase())
      .limit(1)
      .get();
    if (receiverQuery.empty) throw new HttpError(404, "Recipient not found");

    const receiverId = receiverQuery.docs[0].id;
    const senderWalletRef = firestore.collection(collections.wallets).doc(req.auth!.userId);
    const receiverWalletRef = firestore.collection(collections.wallets).doc(receiverId);

    await firestore.runTransaction(async (tx) => {
      const senderSnap = await tx.get(senderWalletRef);
      if (!senderSnap.exists) throw new HttpError(404, "Sender wallet not found");
      const senderBalance = toNumber(senderSnap.data()?.balance);
      if (senderBalance < payload.amount) throw new HttpError(400, "Insufficient balance");

      const receiverSnap = await tx.get(receiverWalletRef);
      if (!receiverSnap.exists) throw new HttpError(404, "Recipient wallet not found");
      const receiverBalance = toNumber(receiverSnap.data()?.balance);

      tx.set(
        senderWalletRef,
        {
          balance: Number((senderBalance - payload.amount).toFixed(2)),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      tx.set(
        receiverWalletRef,
        {
          balance: Number((receiverBalance + payload.amount).toFixed(2)),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      const outRef = firestore.collection(collections.walletTransactions).doc(randomUUID());
      const inRef = firestore.collection(collections.walletTransactions).doc(randomUUID());
      tx.set(outRef, {
        id: outRef.id,
        walletId: req.auth!.userId,
        type: "TRANSFER_OUT",
        amount: Number((-payload.amount).toFixed(2)),
        reference: `to:${payload.toUserEmail.toLowerCase()}`,
        createdAt: new Date().toISOString(),
      });
      tx.set(inRef, {
        id: inRef.id,
        walletId: receiverId,
        type: "TRANSFER_IN",
        amount: Number(payload.amount.toFixed(2)),
        reference: `from:${req.auth!.userId}`,
        createdAt: new Date().toISOString(),
      });
    });

    res.json({ status: "ok" });
  })
);
