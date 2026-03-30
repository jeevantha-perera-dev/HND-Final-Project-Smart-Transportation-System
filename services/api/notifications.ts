import { apiRequest } from "./client";

export type PassengerAnnouncement = {
  id: string;
  title: string;
  body: string;
  /** Matches notification filter chips: Delays | Route Changes | Security | General */
  category: string;
  important: boolean;
  createdAt: string;
};

export async function listPassengerAnnouncements() {
  return apiRequest<{ items: PassengerAnnouncement[] }>("/notifications");
}
