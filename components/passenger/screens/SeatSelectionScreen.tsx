import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError } from "../../../services/api/client";
import { getTripDetail, type TripDetail } from "../../../services/api/trips";
import { passengerRouteDisplayId } from "../../../utils/busDisplay";
import { PassengerHomeStackParamList } from "../types";

const BG = "#121212";
const SURFACE = "#1C1C1E";
const BORDER = "#38383A";
const PRIMARY = "#4A90E2";
const TEXT = "#FFFFFF";
const MUTED = "#8E8E93";

const ROWS = [1, 2, 3, 4, 5] as const;

/** Not selectable — accessibility (matches banner). */
const ACCESSIBILITY_SEATS = new Set(["1A", "1B"]);

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "SeatSelection">;

function normSeat(id: string) {
  return id.trim().toUpperCase();
}

function parseLkrFromLabel(price: string) {
  const n = parseFloat(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatDeparture(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-LK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function SeatSelectionScreen({ navigation, route }: Props) {
  const { tripId, busId: paramBusId = "—", routeName: paramRouteName = "Route", price = "LKR 0" } = route.params ?? {};
  const tripMissing = !tripId?.trim();
  const paramFareLkr = useMemo(() => parseLkrFromLabel(price), [price]);

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(!tripMissing);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const occupiedSet = useMemo(() => {
    const s = new Set<string>();
    for (const id of trip?.occupiedSeatIds ?? []) {
      s.add(normSeat(id));
    }
    return s;
  }, [trip?.occupiedSeatIds]);

  const loadTrip = useCallback(async () => {
    if (!tripId?.trim()) return;
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await getTripDetail(tripId.trim());
      setTrip(detail);
    } catch (e) {
      setTrip(null);
      setLoadError(e instanceof ApiError ? e.message : "Could not load trip details.");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (tripMissing) {
      setLoading(false);
      return;
    }
    void loadTrip();
  }, [tripMissing, loadTrip]);

  useEffect(() => {
    if (!selectedId) return;
    const n = normSeat(selectedId);
    if (ACCESSIBILITY_SEATS.has(n) || occupiedSet.has(n)) {
      setSelectedId(null);
    }
  }, [occupiedSet, selectedId]);

  const baseFareLkr = trip?.baseFare ?? paramFareLkr;
  const displayRouteName = trip?.routeName ?? paramRouteName;
  const displayBusId =
    trip != null
      ? passengerRouteDisplayId(trip.routeCode?.trim() ?? "", trip.shortRouteId)
      : paramBusId;
  const vehicleLabel = trip?.vehicleCode ?? "";
  const priceLabel = `LKR ${baseFareLkr.toFixed(0)}`;

  const totalFare = useMemo(() => {
    if (!selectedId) return baseFareLkr;
    return baseFareLkr;
  }, [selectedId, baseFareLkr]);

  const totalLabel = `LKR ${totalFare.toFixed(0)}`;

  function seatUnavailable(id: string) {
    const n = normSeat(id);
    return ACCESSIBILITY_SEATS.has(n) || occupiedSet.has(n);
  }

  function toggleSeat(id: string) {
    if (seatUnavailable(id)) return;
    setSelectedId((prev) => (prev === id ? null : id));
  }

  const canConfirm =
    Boolean(selectedId) &&
    !tripMissing &&
    !loading &&
    !loadError &&
    trip &&
    trip.seatsAvailable > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Select Your Seat
          </Text>
          <Pressable hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="information-circle-outline" size={22} color={TEXT} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tripMissing ? (
            <View style={styles.warnBanner}>
              <Ionicons name="warning-outline" size={20} color="#FF9F0A" />
              <Text style={styles.warnText}>This trip is not linked to a scheduled service. Go back and pick a bus with live availability.</Text>
            </View>
          ) : null}

          {!tripMissing && loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={PRIMARY} size="large" />
              <Text style={styles.loadingText}>Loading seat map for this trip…</Text>
            </View>
          ) : null}

          {!tripMissing && !loading && loadError ? (
            <View style={styles.errorPanel}>
              <View style={styles.errorRow}>
                <Ionicons name="cloud-offline-outline" size={20} color="#FF9F0A" />
                <Text style={styles.warnText}>{loadError}</Text>
              </View>
              <Pressable style={styles.retryBtn} onPress={() => void loadTrip()}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {!tripMissing && !loading && trip ? (
            <View style={styles.tripCard}>
              <Text style={styles.tripTitle} numberOfLines={2}>
                {displayRouteName}
              </Text>
              <View style={styles.tripRow}>
                <Ionicons name="bus-outline" size={16} color={MUTED} />
                <Text style={styles.tripMetaText}>
                  {vehicleLabel}
                  {displayBusId && vehicleLabel ? " · " : ""}
                  {displayBusId}
                </Text>
              </View>
              {trip.originStopName || trip.destinationStopName ? (
                <View style={styles.tripRow}>
                  <Ionicons name="location-outline" size={16} color={MUTED} />
                  <Text style={styles.tripMetaText} numberOfLines={2}>
                    {trip.originStopName || "—"} → {trip.destinationStopName || "—"}
                  </Text>
                </View>
              ) : null}
              <View style={styles.tripRow}>
                <Ionicons name="time-outline" size={16} color={MUTED} />
                <Text style={styles.tripMetaText}>{formatDeparture(trip.departureAt)}</Text>
              </View>
              <View style={styles.tripFareRow}>
                <Text style={styles.tripFareLabel}>Single trip (LKR)</Text>
                <Text style={styles.tripFareValue}>{baseFareLkr.toFixed(0)}</Text>
              </View>
              <Text style={styles.seatsLeftLine}>
                {trip.seatsAvailable > 0
                  ? `${trip.seatsAvailable} seats left on this bus`
                  : "No seats left — choose another trip"}
              </Text>
            </View>
          ) : null}

          {tripMissing ? (
            <>
              <View style={styles.legend}>
                <LegendDot color="#34C759" label="Available" />
                <LegendDot color="#FF453A" label="Taken / blocked" />
                <LegendDot color={PRIMARY} label="Selected" />
              </View>
              <SeatMapGrid
                seatUnavailable={(id) => ACCESSIBILITY_SEATS.has(normSeat(id))}
                selectedId={selectedId}
                onToggleSeat={toggleSeat}
              />
              <AccessBanner />
              <Text style={styles.routeMeta} numberOfLines={2}>
                {`${paramBusId} · ${paramRouteName}`}
              </Text>
            </>
          ) : null}

          {!tripMissing && trip && !loading ? (
            <>
              <View style={styles.legend}>
                <LegendDot color="#34C759" label="Available" />
                <LegendDot color="#FF453A" label="Taken / blocked" />
                <LegendDot color={PRIMARY} label="Selected" />
              </View>
              <SeatMapGrid
                seatUnavailable={seatUnavailable}
                selectedId={selectedId}
                onToggleSeat={toggleSeat}
              />
              <AccessBanner />
              <Text style={styles.routeMeta} numberOfLines={2}>
                {`${displayBusId} · ${displayRouteName}`}
              </Text>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>Selected Seats</Text>
              {selectedId ? (
                <View style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>{selectedId}</Text>
                </View>
              ) : (
                <Text style={styles.footerPlaceholder}>None</Text>
              )}
            </View>
            <View style={styles.fareCol}>
              <Text style={styles.footerLabel}>Total Fare</Text>
              <Text style={styles.fareValue}>{totalLabel}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
            disabled={!canConfirm}
            onPress={() => {
              if (!canConfirm || !selectedId || !tripId) return;
              navigation.navigate("Checkout", {
                tripId,
                busId: displayBusId,
                routeName: displayRouteName,
                price: priceLabel,
                seatId: selectedId,
                fromStop: trip?.originStopName,
                toStop: trip?.destinationStopName,
              });
            }}
          >
            <Text style={styles.confirmBtnText}>Confirm Selection</Text>
            <Ionicons name="chevron-forward" size={18} color="#0A1628" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DottedRule() {
  return (
    <View style={styles.dottedRule}>
      {Array.from({ length: 28 }).map((_, i) => (
        <View key={i} style={styles.dot} />
      ))}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function AccessBanner() {
  return (
    <View style={styles.accessBanner}>
      <Ionicons name="information-circle" size={22} color={TEXT} style={styles.accessIcon} />
      <View style={styles.accessTextWrap}>
        <Text style={styles.accessTitle}>Accessibility Priority</Text>
        <Text style={styles.accessBody}>
          Seats 1A and 1B are reserved for passengers with limited mobility or disabilities.
        </Text>
      </View>
    </View>
  );
}

function SeatMapGrid({
  seatUnavailable,
  selectedId,
  onToggleSeat,
}: {
  seatUnavailable: (id: string) => boolean;
  selectedId: string | null;
  onToggleSeat: (id: string) => void;
}) {
  return (
    <View style={styles.busShell}>
      <View style={styles.driverBlock}>
        <Ionicons name="person" size={22} color={MUTED} />
        <Text style={styles.driverLabel}>DRIVER</Text>
      </View>

      {ROWS.map((row) => (
        <View key={row} style={styles.seatRow}>
          <Text style={styles.rowNum}>{row}</Text>
          <SeatTile
            id={`${row}A`}
            reserved={seatUnavailable(`${row}A`)}
            selected={selectedId === `${row}A`}
            onPress={() => onToggleSeat(`${row}A`)}
          />
          <SeatTile
            id={`${row}B`}
            reserved={seatUnavailable(`${row}B`)}
            selected={selectedId === `${row}B`}
            onPress={() => onToggleSeat(`${row}B`)}
          />
          <View style={styles.aisle} />
          <SeatTile
            id={`${row}C`}
            reserved={seatUnavailable(`${row}C`)}
            selected={selectedId === `${row}C`}
            onPress={() => onToggleSeat(`${row}C`)}
          />
          <SeatTile
            id={`${row}D`}
            reserved={seatUnavailable(`${row}D`)}
            selected={selectedId === `${row}D`}
            onPress={() => onToggleSeat(`${row}D`)}
          />
        </View>
      ))}

      <DottedRule />
      <View style={styles.rearExitWrap}>
        <View style={styles.rearExitPill}>
          <Text style={styles.rearExitText}>Rear Exit Nearby</Text>
        </View>
      </View>
    </View>
  );
}

function SeatTile({
  id,
  reserved,
  selected,
  onPress,
}: {
  id: string;
  reserved: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.seat,
        reserved && styles.seatReserved,
        selected && !reserved && styles.seatSelected,
      ]}
    >
      {reserved ? (
        <>
          <Ionicons name="lock-closed" size={12} color={MUTED} />
          <Text style={styles.seatIdReserved}>{id}</Text>
        </>
      ) : (
        <>
          <Ionicons
            name="square-outline"
            size={11}
            color={selected ? TEXT : MUTED}
            style={styles.seatGlyph}
          />
          <Text style={[styles.seatId, selected && styles.seatIdOn]}>{id}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  headerIcon: { width: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: TEXT, fontSize: 17, fontWeight: "700", textAlign: "left" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  warnBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#2C2208",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#5C4818",
    padding: 12,
    marginBottom: 16,
  },
  warnText: { flex: 1, color: "#F5E6C8", fontSize: 13, lineHeight: 18, fontWeight: "600" },
  loadingBlock: { alignItems: "center", paddingVertical: 24, gap: 12, marginBottom: 8 },
  loadingText: { color: MUTED, fontSize: 14, fontWeight: "600" },
  errorPanel: {
    backgroundColor: "#2C2208",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#5C4818",
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  retryBtn: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: { color: "#0A1628", fontWeight: "800", fontSize: 13 },
  tripCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  tripTitle: { color: TEXT, fontSize: 17, fontWeight: "800" },
  tripRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tripMetaText: { flex: 1, color: MUTED, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  tripFareRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  tripFareLabel: { color: MUTED, fontSize: 12, fontWeight: "700" },
  tripFareValue: { color: TEXT, fontSize: 20, fontWeight: "800" },
  seatsLeftLine: { color: "#34C759", fontSize: 12, fontWeight: "700", marginTop: 4 },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: TEXT, fontSize: 13, fontWeight: "600" },
  busShell: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  driverBlock: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  driverLabel: { color: MUTED, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 4 },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  rowNum: {
    width: 18,
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  aisle: {
    width: 14,
    marginHorizontal: 2,
    alignSelf: "stretch",
    minHeight: 48,
    borderRadius: 4,
    backgroundColor: "#141416",
  },
  seat: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#48484A",
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 6,
  },
  seatReserved: {
    backgroundColor: "#3A3A3C",
    borderColor: "#4A4A4C",
  },
  seatSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  seatGlyph: { marginBottom: 0 },
  seatId: { color: TEXT, fontSize: 12, fontWeight: "800" },
  seatIdOn: { color: TEXT },
  seatIdReserved: { color: "#636366", fontSize: 11, fontWeight: "700" },
  dottedRule: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
    marginBottom: 10,
  },
  dot: {
    width: 5,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#48484A",
  },
  rearExitWrap: { alignItems: "center" },
  rearExitPill: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rearExitText: { color: MUTED, fontSize: 11, fontWeight: "600" },
  accessBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    gap: 10,
  },
  accessIcon: { marginTop: 2 },
  accessTextWrap: { flex: 1 },
  accessTitle: { color: TEXT, fontSize: 15, fontWeight: "800", marginBottom: 6 },
  accessBody: { color: TEXT, fontSize: 13, lineHeight: 18, opacity: 0.95 },
  routeMeta: { color: MUTED, fontSize: 12, marginTop: 14, textAlign: "center" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  footerLabel: { color: MUTED, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  footerPlaceholder: { color: "#636366", fontSize: 15, fontWeight: "600" },
  seatBadge: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  seatBadgeText: { color: TEXT, fontSize: 14, fontWeight: "800" },
  fareCol: { alignItems: "flex-end" },
  fareValue: { color: TEXT, fontSize: 24, fontWeight: "800" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: { color: "#0A1628", fontSize: 16, fontWeight: "800" },
});
