import { apiRequest } from "./client";

export async function getWallet() {
  return apiRequest<{ id: string; balance: number; rewards: any[]; vouchers: any[] }>("/wallet", {
    auth: true,
  });
}

export async function getWalletHistory() {
  return apiRequest<{ items: any[] }>("/wallet/history", { auth: true });
}

export async function topupWallet(amount: number) {
  return apiRequest<{ status: string; balance: number }>("/wallet/topup", {
    method: "POST",
    auth: true,
    body: { amount },
  });
}

export async function transferWallet(toUserEmail: string, amount: number) {
  return apiRequest<{ status: string }>("/wallet/transfer", {
    method: "POST",
    auth: true,
    body: { toUserEmail, amount },
  });
}
