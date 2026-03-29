import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LocationAutocomplete from "../LocationAutocomplete";
import { ApiError } from "../../services/api/client";
import { getBookingsForTrip, type TripBookingRow } from "../../services/api/booking";
import {
  addTripWalkIn,
  deleteTripWalkIn,
  getTripDetail,
  getTripWalkIns,
  type TripDetail,
  type TripWalkInRow,
} from "../../services/api/trips";

/** Passed on Finish Check; walk-ins are loaded from the API on the live trip screen. */
export type ManageSeatsFinishSummary = {
  noShowCount: number;
};

type DriverManualEntryScreenProps = {
  tripId?: string | null;
  onBack?: () => void;
  onFinishCheck?: (summary: ManageSeatsFinishSummary) => void;
};

function parseLkrAmount(text: string) {
  const n = parseFloat(String(text).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
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

export default function DriverManualEntryScreen({
  tripId,
  onBack,
  onFinishCheck,
}: DriverManualEntryScreenProps) {
  const [walkInRows, setWalkInRows] = useState<TripWalkInRow[]>([]);
  const [walkInsLoading, setWalkInsLoading] = useState(false);
  const [walkInDraftOpen, setWalkInDraftOpen] = useState(false);
  const [draftDestination, setDraftDestination] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [savingWalkIn, setSavingWalkIn] = useState(false);
  const [walkInsError, setWalkInsError] = useState<string | null>(null);
  const [noShowCount, setNoShowCount] = useState(0);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [bookingRows, setBookingRows] = useState<TripBookingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    const id = tripId?.trim();
    if (!id) {
      setTrip(null);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const detail = await getTripDetail(id);
      setTrip(detail);
    } catch (e) {
      setTrip(null);
      let msg = e instanceof ApiError ? e.message : "Could not load trip.";
      if (msg.includes("FAILED_PRECONDITION") || /requires an index/i.test(msg)) {
        msg = "Could not load trip (server query). Restart the API or contact support.";
      }
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    const id = tripId?.trim();
    if (!id) {
      setBookingRows([]);
      return;
    }
    let mounted = true;
    void (async () => {
      try {
        const { items } = await getBookingsForTrip(id);
        if (mounted) setBookingRows(items);
      } catch {
        if (mounted) setBookingRows([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  useEffect(() => {
    const id = tripId?.trim();
    if (!id) {
      setWalkInRows([]);
      return;
    }
    let mounted = true;
    setWalkInsLoading(true);
    void (async () => {
      try {
        const { items } = await getTripWalkIns(id);
        if (mounted) {
          setWalkInRows(items);
          setWalkInsError(null);
        }
      } catch {
        if (mounted) setWalkInRows([]);
      } finally {
        if (mounted) setWalkInsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [tripId]);

  const walkInCount = walkInRows.length;
  const walkInRevenueLkr = useMemo(
    () => walkInRows.reduce((sum, row) => sum + (Number(row.fareLkr) || 0), 0),
    [walkInRows]
  );

  const removeWalkInRow = useCallback(
    async (walkInId: string) => {
      const id = tripId?.trim();
      if (!id) return;
      try {
        await deleteTripWalkIn(id, walkInId);
        const { items } = await getTripWalkIns(id);
        setWalkInRows(items);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Could not remove walk-in.";
        setWalkInsError(msg);
      }
    },
    [tripId]
  );

  const openWalkInDraft = useCallback(() => {
    setDraftError(null);
    setWalkInsError(null);
    setDraftDestination("");
    setDraftAmount("");
    setWalkInDraftOpen(true);
  }, []);

  const cancelWalkInDraft = useCallback(() => {
    setWalkInDraftOpen(false);
    setDraftDestination("");
    setDraftAmount("");
    setDraftError(null);
  }, []);

  const saveWalkInDraft = useCallback(async () => {
    const id = tripId?.trim();
    if (!id) return;
    const fare = parseLkrAmount(draftAmount);
    if (fare <= 0) {
      setDraftError("Enter a fare greater than 0 (LKR).");
      return;
    }
    setDraftError(null);
    setSavingWalkIn(true);
    try {
      await addTripWalkIn(id, {
        destinationNote: draftDestination.trim() || undefined,
        fareLkr: fare,
      });
      const { items } = await getTripWalkIns(id);
      setWalkInRows(items);
      setWalkInDraftOpen(false);
      setDraftDestination("");
      setDraftAmount("");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not save walk-in.";
      setDraftError(msg);
    } finally {
      setSavingWalkIn(false);
    }
  }, [draftAmount, draftDestination, tripId]);

  const appBooked = trip?.occupiedSeatIds?.length ?? 0;
  const currentAppEarningLkr = useMemo(
    () =>
      bookingRows.reduce(
        (sum, b) =>
          b.status === "CONFIRMED" && b.boarded ? sum + (Number(b.totalAmount) || 0) : sum,
        0
      ),
    [bookingRows]
  );
  const totalTripEarningsEstLkr = currentAppEarningLkr + walkInRevenueLkr;
  const seatsAvailableApi = trip?.seatsAvailable ?? 0;
  const totalCapacity = useMemo(() => {
    if (!trip) return 0;
    return Math.max(0, seatsAvailableApi + appBooked);
  }, [trip, seatsAvailableApi, appBooked]);

  const adjustedFilled = useMemo(() => {
    return Math.max(0, appBooked + walkInCount - noShowCount);
  }, [appBooked, walkInCount, noShowCount]);

  const remainingDisplay = useMemo(() => {
    const r = seatsAvailableApi - walkInCount + noShowCount;
    return Math.max(0, r);
  }, [seatsAvailableApi, walkInCount, noShowCount]);

  const capacityPercent = useMemo(() => {
    if (totalCapacity <= 0) return 0;
    return Math.min(100, Math.round((adjustedFilled / totalCapacity) * 100));
  }, [totalCapacity, adjustedFilled]);

  const vehicleLine = useMemo(() => {
    if (!tripId?.trim()) return "Start or open a trip to load live data.";
    if (loadError) return loadError;
    if (loading && !trip) return "Loading trip…";
    if (!trip) return "—";
    const rc = trip.routeCode?.trim();
    const parts = [trip.vehicleCode, rc ? `Route ${rc}` : null].filter(Boolean);
    return parts.join(" · ") || trip.routeName;
  }, [trip, tripId, loading, loadError]);

  const routeSubtitle = useMemo(() => {
    if (!trip) return "";
    const dep = formatDeparture(trip.departureAt);
    const from = trip.originStopName?.trim();
    const to = trip.destinationStopName?.trim();
    if (from && to) return `${dep} · ${from} → ${to}`;
    return dep;
  }, [trip]);

  const resetAll = useCallback(() => {
    const id = tripId?.trim();
    void (async () => {
      if (id && walkInRows.length > 0) {
        try {
          await Promise.all(walkInRows.map((w) => deleteTripWalkIn(id, w.id)));
          const { items } = await getTripWalkIns(id);
          setWalkInRows(items);
        } catch {
          /* keep list; user can retry */
        }
      } else {
        setWalkInRows([]);
      }
      setWalkInDraftOpen(false);
      setDraftDestination("");
      setDraftAmount("");
      setDraftError(null);
      setWalkInsError(null);
      setNoShowCount(0);
    })();
  }, [tripId, walkInRows]);

  const handleFinishCheck = useCallback(() => {
    onFinishCheck?.({ noShowCount });
  }, [noShowCount, onFinishCheck]);

  const peopleChip =
    !tripId?.trim() || !trip
      ? "—/—"
      : `${adjustedFilled}/${totalCapacity}`;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#DEEAF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Seats</Text>
        <Pressable style={styles.saveBtn}>
          <Ionicons name="save-outline" size={15} color="#61A9FF" />
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <View style={styles.separator} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          walkInDraftOpen ? styles.scrollContentWalkInDraft : null,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyTop}>
            <View style={styles.occupancyTitleBlock}>
              <Text style={styles.occupancyTitle}>Live Occupancy</Text>
              <Text style={styles.vehicleText} numberOfLines={2}>
                {trip?.routeName ? `${trip.routeName}\n` : ""}
                {vehicleLine}
              </Text>
              {routeSubtitle ? (
                <Text style={styles.routeSub} numberOfLines={2}>
                  {routeSubtitle}
                </Text>
              ) : null}
            </View>
            <View style={styles.peopleChip}>
              {loading && tripId?.trim() ? (
                <ActivityIndicator size="small" color="#6DB0FF" />
              ) : (
                <>
                  <Ionicons name="people-outline" size={12} color="#6DB0FF" />
                  <Text style={styles.peopleText}>{peopleChip}</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.ringWrap}>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringValue}>{capacityPercent}%</Text>
                <Text style={styles.ringLabel}>CAPACITY</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>App Bookings</Text>
              <Text style={styles.metricValue}>{trip ? appBooked : "—"}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>Remaining</Text>
              <Text style={[styles.metricValue, styles.remainingValue]}>
                {trip ? remainingDisplay : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.earningsBlock}>
            <Text style={styles.earningsBlockTitle}>Trip earnings</Text>
            <View style={styles.earningsLine}>
              <Text style={styles.earningsLineLabel}>Current earning (app · boarded)</Text>
              <Text style={styles.earningsLineValue}>
                {trip ? `LKR ${currentAppEarningLkr.toFixed(0)}` : "—"}
              </Text>
            </View>
            <View style={styles.earningsLine}>
              <Text style={styles.earningsLineLabel}>Walk-in cash</Text>
              <Text style={styles.earningsLineValue}>
                {trip ? `LKR ${walkInRevenueLkr.toFixed(0)}` : "—"}
              </Text>
            </View>
            <View style={[styles.earningsLine, styles.earningsTotalLine]}>
              <Text style={styles.earningsTotalLabel}>Total</Text>
              <Text style={styles.earningsTotalValue}>
                {trip ? `LKR ${totalTripEarningsEstLkr.toFixed(0)}` : "—"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>MANUAL CORRECTIONS</Text>

        <View style={styles.walkInCard}>
          <View style={styles.walkInHeaderRow}>
            <View style={[styles.adjustIconWrap, styles.greenBg]}>
              <Ionicons name="person-add-outline" size={20} color="#27CE6E" />
            </View>
            <View style={styles.adjustInfo}>
              <Text style={styles.adjustTitle}>Walk-in Passengers</Text>
              <Text style={styles.adjustSubtitle}>
                Add each passenger: fill fare (by destination), save, then add the next
              </Text>
            </View>
            <View style={styles.walkInCountBadge}>
              {walkInsLoading ? (
                <ActivityIndicator size="small" color="#8EC5FF" />
              ) : (
                <Text style={styles.walkInCountBadgeText}>{walkInCount}</Text>
              )}
            </View>
          </View>

          {walkInsError ? <Text style={styles.walkInDraftError}>{walkInsError}</Text> : null}

          {walkInRows.length > 0 ? (
            <View style={styles.walkInSavedList}>
              <Text style={styles.walkInSavedListTitle}>Saved walk-ins</Text>
              {walkInRows.map((row, index) => {
                const label =
                  row.destinationNote.trim() ||
                  `Passenger ${index + 1}`;
                return (
                  <View key={row.id} style={styles.walkInSavedRow}>
                    <View style={styles.walkInSavedTextCol}>
                      <Text style={styles.walkInSavedName} numberOfLines={2}>
                        #{index + 1} · {label}
                      </Text>
                      <Text style={styles.walkInSavedFare}>LKR {(Number(row.fareLkr) || 0).toFixed(0)}</Text>
                    </View>
                    <Pressable
                      style={styles.walkInRemoveBtn}
                      onPress={() => void removeWalkInRow(row.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color="#C75C5C" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : null}

          {walkInDraftOpen ? (
            <View style={styles.walkInDraftCard}>
              <Text style={styles.walkInDraftTitle}>New walk-in</Text>
              <Text style={styles.walkInDestLabel}>Drop-off / destination (optional)</Text>
              <View style={styles.walkInDestAutocompleteWrap}>
                <LocationAutocomplete
                  variant="driver"
                  placeholder="Search place"
                  value={draftDestination}
                  onChange={setDraftDestination}
                  onSelect={() => {}}
                  iconType="destination"
                />
              </View>
              <View style={styles.walkInAmountRow}>
                <Text style={styles.walkInAmountLabel}>Fare (LKR)</Text>
                <TextInput
                  value={draftAmount}
                  onChangeText={setDraftAmount}
                  keyboardType="decimal-pad"
                  placeholder="Required"
                  placeholderTextColor="#5C6B7A"
                  style={styles.walkInAmountInput}
                />
              </View>
              {draftError ? <Text style={styles.walkInDraftError}>{draftError}</Text> : null}
              <View style={styles.walkInDraftActions}>
                <Pressable style={styles.walkInCancelBtn} onPress={cancelWalkInDraft}>
                  <Text style={styles.walkInCancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.walkInSaveBtn, savingWalkIn && styles.walkInSaveBtnDisabled]}
                  onPress={() => void saveWalkInDraft()}
                  disabled={savingWalkIn}
                >
                  {savingWalkIn ? (
                    <ActivityIndicator size="small" color="#25486E" />
                  ) : (
                    <Ionicons name="checkmark-circle-outline" size={18} color="#25486E" />
                  )}
                  <Text style={styles.walkInSaveBtnText}>{savingWalkIn ? "Saving…" : "Save"}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={[styles.addWalkInBtn, (!trip || !tripId?.trim()) && styles.addWalkInBtnDisabled]}
              onPress={openWalkInDraft}
              disabled={!trip || !tripId?.trim()}
            >
              <Ionicons name="add-circle-outline" size={20} color={trip ? "#49D482" : "#4A5A6A"} />
              <Text style={[styles.addWalkInText, !trip && styles.addWalkInTextDisabled]}>Add walk-in passenger</Text>
            </Pressable>
          )}

          <Text style={styles.walkInFareHint}>
            {trip
              ? `Walk-in cash total: LKR ${walkInRevenueLkr.toFixed(0)} · ${walkInCount} passenger(s) counted for occupancy`
              : "Load a trip to add walk-ins"}
          </Text>
        </View>

        <View style={styles.adjustCard}>
          <View style={[styles.adjustIconWrap, styles.redBg]}>
            <Ionicons name="alert-circle-outline" size={20} color="#EA3B3B" />
          </View>
          <View style={styles.adjustInfo}>
            <Text style={styles.adjustTitle}>App No-Shows</Text>
            <Text style={styles.adjustSubtitle}>Booked but not boarded</Text>
          </View>
          <View style={styles.counterWrap}>
            <Pressable
              style={styles.counterBtn}
              onPress={() => setNoShowCount((prev) => Math.max(0, prev - 1))}
            >
              <Ionicons name="person-remove-outline" size={16} color="#49D482" />
            </Pressable>
            <Text style={styles.counterValue}>{noShowCount}</Text>
            <Pressable
              style={styles.counterBtn}
              onPress={() => setNoShowCount((prev) => prev + 1)}
            >
              <Ionicons name="person-add-outline" size={16} color="#D84B4B" />
            </Pressable>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color="#89BFFF" />
          <Text style={styles.infoText}>
            Walk-ins are saved to the trip on the server when you tap Save. Current earning sums
            confirmed tickets you marked as boarded. Finish Check returns to the trip dashboard with
            your no-show count; walk-ins and cash are loaded from the server on the live trip screen.
          </Text>
        </View>

        <View style={styles.bottomActions}>
          <Pressable style={styles.resetBtn} onPress={resetAll}>
            <Ionicons name="refresh-outline" size={16} color="#D8E7F7" />
            <Text style={styles.resetText}>Reset All</Text>
          </Pressable>
          <Pressable style={styles.finishBtn} onPress={handleFinishCheck}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#25486E" />
            <Text style={styles.finishText}>Finish Check</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D", paddingHorizontal: 14, paddingTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  /** Extra space so OSM suggestion list is not clipped by ScrollView while draft is open. */
  scrollContentWalkInDraft: { paddingBottom: 260 },
  header: { height: 46, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6, flex: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  saveText: { color: "#61A9FF", fontSize: 15, fontWeight: "700" },
  separator: { height: 1, backgroundColor: "#1F2E3F", marginTop: 6, marginBottom: 10 },
  occupancyCard: { backgroundColor: "#0B2741", borderRadius: 14, borderWidth: 1, borderColor: "#163A5D", padding: 14 },
  occupancyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  occupancyTitleBlock: { flex: 1, marginRight: 8 },
  occupancyTitle: { color: "#E9F4FF", fontSize: 18, fontWeight: "800" },
  vehicleText: { color: "#5F9DDA", fontSize: 13, fontWeight: "600", marginTop: 4 },
  routeSub: { color: "#8EB4D4", fontSize: 12, fontWeight: "600", marginTop: 4 },
  peopleChip: {
    minWidth: 72,
    borderRadius: 999,
    backgroundColor: "#142A43",
    borderWidth: 1,
    borderColor: "#1F3D5D",
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  peopleText: { color: "#6DB0FF", fontSize: 12, fontWeight: "700" },
  ringWrap: { alignItems: "center", marginVertical: 12 },
  ringOuter: {
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 16,
    borderColor: "#66AFFF",
    borderRightColor: "#2C3B4E",
    borderBottomColor: "#2C3B4E",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-35deg" }],
  },
  ringInner: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#0B1E33",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "35deg" }],
  },
  ringValue: { color: "#F3F9FF", fontSize: 24, fontWeight: "800" },
  ringLabel: { color: "#E2EEF8", fontSize: 13, fontWeight: "800", marginTop: 2 },
  metricsRow: { flexDirection: "row", gap: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: "#121A26",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E2A3B",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metricTitle: { color: "#AFBED0", fontSize: 14, fontWeight: "700" },
  metricValue: { color: "#F1F7FF", fontSize: 32, fontWeight: "800", marginTop: 2 },
  remainingValue: { color: "#45D282" },
  earningsBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#163A5D",
  },
  earningsBlockTitle: { color: "#B8D4F0", fontSize: 12, fontWeight: "800", letterSpacing: 0.3, marginBottom: 8 },
  earningsLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  earningsLineLabel: { color: "#8FA9C4", fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 },
  earningsLineValue: { color: "#E8F2FC", fontSize: 14, fontWeight: "700" },
  earningsTotalLine: { marginTop: 4, paddingTop: 8, marginBottom: 0, borderTopWidth: 1, borderTopColor: "#1E3A5C" },
  earningsTotalLabel: { color: "#E9F4FF", fontSize: 15, fontWeight: "800" },
  earningsTotalValue: { color: "#F4C44B", fontSize: 18, fontWeight: "800" },
  sectionLabel: {
    color: "#D8E3EE",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 10,
  },
  walkInCard: {
    borderRadius: 12,
    backgroundColor: "#1A222E",
    borderWidth: 1,
    borderColor: "#273243",
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  walkInHeaderRow: { flexDirection: "row", alignItems: "center" },
  walkInSavedList: { marginTop: 12 },
  walkInSavedListTitle: { color: "#8FA9C4", fontSize: 11, fontWeight: "800", letterSpacing: 0.4, marginBottom: 8 },
  walkInSavedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: "#151D28",
    borderWidth: 1,
    borderColor: "#2A3544",
  },
  walkInSavedTextCol: { flex: 1, marginRight: 8 },
  walkInSavedName: { color: "#D8E6F4", fontSize: 14, fontWeight: "600" },
  walkInSavedFare: { color: "#F4C44B", fontSize: 15, fontWeight: "800", marginTop: 4 },
  walkInDraftCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#151D28",
    borderWidth: 1,
    borderColor: "#37506D",
    overflow: "visible",
    zIndex: 2,
    elevation: 8,
  },
  walkInDraftTitle: { color: "#E9F4FF", fontSize: 15, fontWeight: "800", marginBottom: 10 },
  walkInDraftError: { color: "#E88A8A", fontSize: 12, fontWeight: "600", marginTop: 6 },
  walkInDraftActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  walkInCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3D4A5C",
    alignItems: "center",
    justifyContent: "center",
  },
  walkInCancelBtnText: { color: "#B8C8DA", fontSize: 15, fontWeight: "700" },
  walkInSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#65AEF3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  walkInSaveBtnText: { color: "#25486E", fontSize: 15, fontWeight: "800" },
  walkInSaveBtnDisabled: { opacity: 0.65 },
  walkInCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22364D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  walkInCountBadgeText: { color: "#8EC5FF", fontSize: 14, fontWeight: "800" },
  walkInRemoveBtn: { padding: 4 },
  walkInDestLabel: {
    color: "#A8B7C8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  walkInDestAutocompleteWrap: {
    marginBottom: 10,
    overflow: "visible",
  },
  walkInAmountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  walkInAmountLabel: { color: "#A8B7C8", fontSize: 13, fontWeight: "700", width: 88 },
  walkInAmountInput: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#37506D",
    backgroundColor: "#151D28",
    color: "#F0F6FF",
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addWalkInBtn: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2F4D3A",
    backgroundColor: "#152018",
  },
  addWalkInBtnDisabled: { opacity: 0.45 },
  addWalkInText: { color: "#49D482", fontSize: 15, fontWeight: "700" },
  addWalkInTextDisabled: { color: "#5A6B78" },
  walkInFareHint: { color: "#6D8AA8", fontSize: 12, fontWeight: "600", marginTop: 12 },
  adjustCard: {
    minHeight: 78,
    borderRadius: 12,
    backgroundColor: "#1A222E",
    borderWidth: 1,
    borderColor: "#273243",
    marginBottom: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  adjustIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  greenBg: { backgroundColor: "rgba(33,170,91,0.22)" },
  redBg: { backgroundColor: "rgba(185,38,38,0.24)" },
  adjustInfo: { flex: 1, marginLeft: 10 },
  adjustTitle: { color: "#EEF4FC", fontSize: 16, fontWeight: "800" },
  adjustSubtitle: { color: "#A8B7C8", fontSize: 14, marginTop: 2, fontWeight: "600" },
  counterWrap: {
    width: 128,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#151D28",
    borderWidth: 1,
    borderColor: "#273244",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  counterBtn: {
    width: 34,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#1E2735",
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: { color: "#F0F6FF", fontSize: 20, fontWeight: "800" },
  infoCard: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#18599A",
    backgroundColor: "#0C3C6D",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
  },
  infoText: { flex: 1, color: "#AFCDEB", fontSize: 13, lineHeight: 18, fontWeight: "600" },
  bottomActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  resetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2D3A4B",
    backgroundColor: "#141C28",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  resetText: { color: "#D8E7F7", fontSize: 16, fontWeight: "700" },
  finishBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#65AEF3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  finishText: { color: "#25486E", fontSize: 16, fontWeight: "800" },
});
