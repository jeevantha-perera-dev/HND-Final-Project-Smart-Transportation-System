import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "../../services/api/client";
import { setBookingBoarded } from "../../services/api/booking";
import { getTripDetail, type TripDetail } from "../../services/api/trips";

export type DriverPassengerDetails = {
  id: string;
  name: string;
  type: "Adult" | "Student" | "Senior";
  tickets: string;
  seat?: string;
  boarded?: boolean;
};

const ROWS = [1, 2, 3, 4, 5] as const;
const LETTERS = ["A", "B", "C", "D"] as const;
const ALL_BUS_SEATS = ROWS.flatMap((r) => LETTERS.map((l) => `${r}${l}`));
const ACCESSIBILITY_SEATS = new Set(["1A", "1B"]);

function normSeat(id: string) {
  return id.trim().toUpperCase();
}

function firstSelectableSeat() {
  return ALL_BUS_SEATS.find((s) => !ACCESSIBILITY_SEATS.has(s)) ?? "2A";
}

type DriverQueueDetailsScreenProps = {
  passenger?: DriverPassengerDetails | null;
  tripId?: string | null;
  onBack?: () => void;
  onBoardingChanged?: () => void;
};

export default function DriverQueueDetailsScreen({
  passenger,
  tripId,
  onBack,
  onBoardingChanged,
}: DriverQueueDetailsScreenProps) {
  const [isBoarded, setIsBoarded] = useState(false);
  const [boardSaving, setBoardSaving] = useState(false);
  const [isNoShow, setIsNoShow] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(firstSelectableSeat);
  const [note, setNote] = useState("");
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [tripLoading, setTripLoading] = useState(false);
  const [tripError, setTripError] = useState<string | null>(null);

  const passengerSeatNorm = useMemo(
    () => (passenger?.seat ? normSeat(passenger.seat) : ""),
    [passenger?.seat]
  );

  const loadTrip = useCallback(async () => {
    const id = tripId?.trim();
    if (!id) {
      setTrip(null);
      setTripError(null);
      return;
    }
    setTripLoading(true);
    setTripError(null);
    try {
      const detail = await getTripDetail(id);
      setTrip(detail);
    } catch (e) {
      setTrip(null);
      setTripError(e instanceof ApiError ? e.message : "Could not load seats.");
    } finally {
      setTripLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void loadTrip();
  }, [loadTrip]);

  const occupiedSet = useMemo(() => {
    const s = new Set<string>();
    for (const id of trip?.occupiedSeatIds ?? []) {
      s.add(normSeat(id));
    }
    return s;
  }, [trip?.occupiedSeatIds]);

  useEffect(() => {
    setIsBoarded(Boolean(passenger?.boarded));
    setIsNoShow(false);
    setNote("");
    const fromPassenger = passengerSeatNorm;
    setSelectedSeat(fromPassenger && ALL_BUS_SEATS.includes(fromPassenger) ? fromPassenger : firstSelectableSeat());
  }, [passenger?.id, passenger?.boarded, passengerSeatNorm]);

  const toggleBoarded = useCallback(async () => {
    if (!passenger?.id) return;
    if (!tripId?.trim()) {
      setIsBoarded((prev) => !prev);
      return;
    }
    const next = !isBoarded;
    setBoardSaving(true);
    try {
      await setBookingBoarded(passenger.id, next);
      setIsBoarded(next);
      onBoardingChanged?.();
    } catch (e) {
      Alert.alert("Could not update boarding", e instanceof ApiError ? e.message : "Try again.");
    } finally {
      setBoardSaving(false);
    }
  }, [isBoarded, onBoardingChanged, passenger?.id, tripId]);

  const seatTakenByOther = useCallback(
    (seat: string) => {
      if (!occupiedSet.has(seat)) return false;
      if (passengerSeatNorm && seat === passengerSeatNorm) return false;
      return true;
    },
    [occupiedSet, passengerSeatNorm]
  );

  const seatDisabled = useCallback(
    (seat: string) => ACCESSIBILITY_SEATS.has(seat) || seatTakenByOther(seat),
    [seatTakenByOther]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E4EEF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Queue Details</Text>
      </View>
      <View style={styles.separator} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#DDEAF8" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{passenger?.name ?? "Passenger"}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaBadge}>{passenger?.type ?? "Adult"}</Text>
              <Text style={styles.metaText}>• {passenger?.tickets ?? "—"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.stateCard}>
          <Text style={styles.sectionTitle}>Boarding State</Text>
          <Pressable
            style={[styles.switchRow, boardSaving && styles.switchRowDisabled]}
            onPress={() => void toggleBoarded()}
            disabled={boardSaving}
          >
            <Text style={styles.switchLabel}>Marked as Boarded</Text>
            {boardSaving ? (
              <ActivityIndicator size="small" color="#4DAE7E" />
            ) : (
              <View style={[styles.toggle, isBoarded && styles.toggleActive]}>
                <View style={[styles.knob, isBoarded && styles.knobActive]} />
              </View>
            )}
          </Pressable>
          <Pressable style={styles.switchRow} onPress={() => setIsNoShow((prev) => !prev)}>
            <Text style={styles.switchLabel}>Marked as No-Show</Text>
            <View style={[styles.toggle, isNoShow && styles.toggleActiveDanger]}>
              <View style={[styles.knob, isNoShow && styles.knobActive]} />
            </View>
          </Pressable>
        </View>

        <View style={styles.stateCard}>
          <Text style={styles.sectionTitle}>Seat Assignment</Text>
          {tripId?.trim() && tripLoading ? (
            <View style={styles.tripLoadRow}>
              <ActivityIndicator size="small" color="#66AEEF" />
              <Text style={styles.tripLoadText}>Loading seat map…</Text>
            </View>
          ) : null}
          {tripError ? <Text style={styles.tripErrText}>{tripError}</Text> : null}
          <Text style={styles.seatHint}>
            Same layout as passenger app (rows 1–5). 1A/1B are reserved. Grey seats are booked by
            others.
          </Text>
          <View style={styles.seatGrid}>
            {ALL_BUS_SEATS.map((seat) => {
              const disabled = seatDisabled(seat);
              const selected = selectedSeat === seat;
              const accessibility = ACCESSIBILITY_SEATS.has(seat);
              return (
                <Pressable
                  key={seat}
                  style={[
                    styles.seatChip,
                    selected && styles.seatChipActive,
                    disabled && !selected && styles.seatChipDisabled,
                    accessibility && styles.seatChipBlocked,
                  ]}
                  disabled={disabled}
                  onPress={() => setSelectedSeat(seat)}
                >
                  <Text
                    style={[
                      styles.seatText,
                      selected && styles.seatTextActive,
                      disabled && !selected && styles.seatTextDisabled,
                    ]}
                  >
                    {seat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.stateCard}>
          <Text style={styles.sectionTitle}>Driver Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder="Add a quick note for this passenger..."
            placeholderTextColor="#8398AE"
            style={styles.noteInput}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D", paddingHorizontal: 14, paddingTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: { height: 46, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1F2D3F", marginTop: 6, marginBottom: 12 },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#293546",
    backgroundColor: "#1A232F",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E4054",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { marginLeft: 10, flex: 1 },
  name: { color: "#EEF5FC", fontSize: 17, fontWeight: "800" },
  metaRow: { marginTop: 3, flexDirection: "row", alignItems: "center" },
  metaBadge: {
    borderRadius: 999,
    backgroundColor: "#22364D",
    color: "#7EB1E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  metaText: { color: "#A8BCCD", fontSize: 12, marginLeft: 6, fontWeight: "600" },
  stateCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#283446",
    backgroundColor: "#171F2B",
    padding: 12,
  },
  sectionTitle: { color: "#D9E5F1", fontSize: 15, fontWeight: "800", marginBottom: 8 },
  switchRow: {
    height: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchRowDisabled: { opacity: 0.7 },
  switchLabel: { color: "#C2D2E2", fontSize: 13, fontWeight: "600" },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#455468",
    padding: 2,
  },
  toggleActive: { backgroundColor: "#4DAE7E" },
  toggleActiveDanger: { backgroundColor: "#A34B5A" },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#EFF6FF" },
  knobActive: { marginLeft: 18 },
  tripLoadRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tripLoadText: { color: "#9BB4CC", fontSize: 13, fontWeight: "600" },
  tripErrText: { color: "#E88A8A", fontSize: 12, fontWeight: "600", marginBottom: 8 },
  seatHint: { color: "#8A9BAE", fontSize: 11, fontWeight: "600", marginBottom: 10, lineHeight: 16 },
  seatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  seatChip: {
    width: 52,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#37506D",
    backgroundColor: "#152333",
    alignItems: "center",
    justifyContent: "center",
  },
  seatChipActive: { backgroundColor: "#66AEEF", borderColor: "#66AEEF" },
  seatChipDisabled: { backgroundColor: "#0F1824", borderColor: "#2A3544", opacity: 0.85 },
  seatChipBlocked: { borderColor: "#4A3D2E", backgroundColor: "#1A1814" },
  seatText: { color: "#BFD3E9", fontSize: 12, fontWeight: "700" },
  seatTextActive: { color: "#214A75" },
  seatTextDisabled: { color: "#5C6B7A" },
  noteInput: {
    minHeight: 86,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A3A4E",
    backgroundColor: "#141E2A",
    color: "#EAF2FB",
    textAlignVertical: "top",
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});
