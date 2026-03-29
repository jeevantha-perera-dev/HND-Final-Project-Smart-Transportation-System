import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import QRCode from "react-native-qrcode-svg";
import { useFocusEffect } from "@react-navigation/native";
import { auth } from "../../../services/firebase/client";
import { fetchTicketForBooking, loadPassengerBookingsForTripsScreen } from "../../../services/firebase/passengerBookings";
import type { MyBookingItem, MyBookingTrip } from "../../../services/api/booking";
import { colors, spacing } from "../theme";
import { PrimaryButton } from "../ui";
import PassengerBottomNav from "../PassengerBottomNav";
import { PassengerRootStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "QRTicket">;

function effectiveTrip(item: MyBookingItem): MyBookingTrip {
  return item.trip ?? item.tripSnapshot ?? null;
}

function pickBooking(items: MyBookingItem[], bookingId?: string): MyBookingItem | null {
  if (bookingId) {
    const found = items.find((i) => i.id === bookingId);
    if (found) return found;
  }
  const upcoming = items.filter((i) => {
    const t = effectiveTrip(i);
    const st = String(t?.status ?? "").toLowerCase();
    return i.status === "CONFIRMED" && st !== "completed" && st !== "cancelled";
  });
  upcoming.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (upcoming[0]) return upcoming[0];
  const confirmed = items.filter((i) => i.status === "CONFIRMED");
  confirmed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return confirmed[0] ?? null;
}

function abbrevStop(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (letters.length >= 3) return letters.slice(0, 3);
  return name.trim().slice(0, 3).toUpperCase() || "—";
}

function formatSeatLabel(seatId: string | undefined): string {
  if (!seatId) return "—";
  const s = String(seatId);
  return s.toLowerCase().includes("seat") ? s : `Seat ${s}`;
}

function formatLkr(n: number | undefined): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return `LKR ${v.toFixed(2)}`;
}

function formatDateTime(iso: string | undefined, dateOnly?: boolean): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  if (dateOnly) return d.toLocaleDateString();
  return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

async function resolveQrPayload(booking: MyBookingItem): Promise<{ value: string; issuedAt: string }> {
  if (booking.ticket?.qrCode) {
    return {
      value: booking.ticket.qrCode,
      issuedAt: booking.ticket.issuedAt ?? booking.createdAt,
    };
  }
  try {
    const t = await fetchTicketForBooking(booking.id);
    if (t?.qrCode) {
      return { value: t.qrCode, issuedAt: t.issuedAt ?? booking.createdAt };
    }
  } catch {
    /* Firestore ticket unreadable — fall back */
  }
  return { value: `QR-${booking.id}`, issuedAt: booking.createdAt };
}

export default function QRTicketScreen({ navigation, route }: Props) {
  const paramBookingId = route.params?.bookingId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<MyBookingItem | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await loadPassengerBookingsForTripsScreen();
      const picked = pickBooking(items, paramBookingId);
      if (!picked) {
        setBooking(null);
        setQrPayload(null);
        setIssuedAt("");
        setError("No booking found. Book a trip from Home, then open your ticket here.");
        return;
      }
      if (picked.status !== "CONFIRMED") {
        setBooking(picked);
        setQrPayload(null);
        setIssuedAt("");
        setError("This booking is not confirmed yet. Complete payment to get your QR ticket.");
        return;
      }
      const { value, issuedAt: iss } = await resolveQrPayload(picked);
      setBooking(picked);
      setQrPayload(value);
      setIssuedAt(iss);
      setError(null);
    } catch {
      setBooking(null);
      setQrPayload(null);
      setError("Could not load your ticket. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [paramBookingId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const trip = booking ? effectiveTrip(booking) : null;
  const routeHeadline = useMemo(() => {
    if (!trip) {
      return { left: "—", leftCap: "From", right: "—", rightCap: "To" };
    }
    const code = (trip.routeCode ?? trip.routeId ?? "").trim();
    const from = (trip.originStopName ?? "Origin").trim();
    const to = (trip.destinationStopName ?? "Destination").trim();
    return {
      left: code || abbrevStop(from),
      leftCap: from,
      right: abbrevStop(to),
      rightCap: to,
    };
  }, [trip]);

  const passengerName =
    auth.currentUser?.displayName?.trim() || auth.currentUser?.email?.split("@")[0] || "Passenger";

  const brandLine = trip?.routeName?.trim() || "TransitFlow";

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>QR Ticket</Text>
            <View style={styles.backBtn} />
          </View>

          {loading ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator color="#74B5F7" />
              <Text style={styles.muted}>Loading ticket…</Text>
            </View>
          ) : null}

          {!loading && error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!loading && booking && !error ? (
            <View style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketBrand} numberOfLines={2}>
                  {brandLine}
                </Text>
                <Text style={styles.ticketBadge}>{booking.status === "CONFIRMED" ? "Confirmed" : booking.status}</Text>
              </View>
              <View style={styles.routeRow}>
                <View style={styles.routeEnd}>
                  <Text style={styles.city}>{routeHeadline.left}</Text>
                  <Text style={styles.cityCaption} numberOfLines={2}>
                    {routeHeadline.leftCap}
                  </Text>
                </View>
                <View style={styles.routeCenter}>
                  <View style={styles.routeLine} />
                  <Ionicons name="bus-outline" size={16} color="#8EC5FF" />
                  <View style={styles.routeLine} />
                </View>
                <View style={[styles.routeEnd, styles.routeEndRight]}>
                  <Text style={styles.city}>{routeHeadline.right}</Text>
                  <Text style={styles.cityCaption} numberOfLines={2}>
                    {routeHeadline.rightCap}
                  </Text>
                </View>
              </View>

              <View style={styles.qrWrap}>
                {qrPayload ? (
                  <View style={styles.qrWhite}>
                    <QRCode value={qrPayload} size={158} backgroundColor="#FFFFFF" color="#0D1A2B" />
                  </View>
                ) : (
                  <View style={styles.qrCore}>
                    <Ionicons name="qr-code-outline" size={88} color="#2B3C50" />
                  </View>
                )}
                <Text style={styles.qrHint} numberOfLines={2}>
                  {qrPayload ? "Show this code when boarding." : "—"}
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <Info label="ISSUED" value={formatDateTime(issuedAt, true)} />
                <Info label="DEPARTURE" value={formatDateTime(trip?.departureAt)} />
                <Info label="SEAT" value={formatSeatLabel(booking.seatId)} />
                <Info label="BUS" value={trip?.vehicleCode?.trim() || trip?.vehicleId?.trim() || "—"} />
              </View>

              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.footerLabel}>Passenger</Text>
                  <Text style={styles.footerValue} numberOfLines={1}>
                    {passengerName}
                  </Text>
                </View>
                <View style={styles.footerFare}>
                  <Text style={styles.footerLabel}>Fare paid</Text>
                  <Text style={styles.footerValue}>{formatLkr(booking.totalAmount)}</Text>
                </View>
              </View>
              <Text style={styles.bookingRef} numberOfLines={1}>
                Booking · {booking.id}
              </Text>
            </View>
          ) : null}

          <PrimaryButton title="Track Bus Live" onPress={() => navigation.navigate("LiveTracking")} />
        </ScrollView>
        <PassengerBottomNav active="Trips" />
      </LinearGradient>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: spacing.page, paddingBottom: 24 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: "800" },
  centerBlock: { paddingVertical: 24, alignItems: "center", gap: 10 },
  muted: { color: "#8FA4BC", fontSize: 14 },
  errorText: {
    color: "#FFB4B4",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    fontWeight: "600",
  },
  ticketCard: {
    borderRadius: 18,
    backgroundColor: "#E5EAF0",
    padding: 12,
    marginBottom: 14,
  },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  ticketBrand: { flex: 1, color: "#145390", fontWeight: "800", fontSize: 13 },
  ticketBadge: { color: "#225F9E", fontSize: 10, fontWeight: "700" },
  routeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  routeEnd: { flex: 1, minWidth: 0 },
  routeEndRight: { alignItems: "flex-end" },
  city: { color: "#0D1A2B", fontSize: 28, fontWeight: "800" },
  cityCaption: { color: "#516175", fontSize: 10, fontWeight: "700", letterSpacing: 0.4, marginTop: 2 },
  routeCenter: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  routeLine: { height: 1, width: 22, backgroundColor: "#9BB8D8" },
  qrWrap: {
    borderRadius: 12,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#D6DEE7",
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  qrWhite: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  qrCore: {
    width: 170,
    height: 170,
    borderRadius: 8,
    backgroundColor: "#C9D6E5",
    alignItems: "center",
    justifyContent: "center",
  },
  qrHint: { marginTop: 10, color: "#5E6E84", fontSize: 11, fontWeight: "600", textAlign: "center" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  infoItem: { width: "50%" },
  infoLabel: { color: "#5E6E84", fontSize: 9, fontWeight: "700", letterSpacing: 0.6 },
  infoValue: { color: "#1E2D41", fontSize: 12, fontWeight: "800", marginTop: 2 },
  footerRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#CED8E2",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerFare: { alignItems: "flex-end", maxWidth: "48%" },
  footerLabel: { color: "#6A798E", fontSize: 10, fontWeight: "700" },
  footerValue: { color: "#19314D", fontSize: 13, fontWeight: "800", marginTop: 1 },
  bookingRef: { marginTop: 8, color: "#6A798E", fontSize: 10, fontWeight: "600" },
});
