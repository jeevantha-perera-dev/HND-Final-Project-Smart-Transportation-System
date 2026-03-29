import { apiRequest } from "./client";

export type WalletResponse = {
  id: string;
  balance: number;
  transitPoints?: number;
  rewards: Array<{ id?: string; title?: string; progress?: number; label?: string }>;
  vouchers: unknown[];
};

export async function getWallet() {
  return apiRequest<WalletResponse>("/wallet", {
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
