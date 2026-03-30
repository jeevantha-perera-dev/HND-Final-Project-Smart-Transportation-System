import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { CompletedTripCard, ScreenCard, SectionHeader, TabSwitcher, TripCard } from "../ui";
import { colors, spacing } from "../theme";
import { PassengerRootStackParamList, PassengerTabsParamList } from "../types";
import FilterModal, { TripFilters } from "../FilterModal";
import FilterChip from "../FilterChip";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { loadPassengerBookingsForTripsScreen } from "../../../services/firebase/passengerBookings";
import type { MyBookingItem } from "../../../services/api/booking";

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabsParamList, "Trips">,
  NativeStackScreenProps<PassengerRootStackParamList>
>;

const tabs = ["Upcoming", "Completed"] as const;
type TripsTab = (typeof tabs)[number];

type UpcomingRow = {
  key: string;
  tripId: string;
  routeTitle: string;
  route: string;
  status: "Live Now" | "Upcoming" | "In Progress";
  from: string;
  to: string;
  date: string;
  time: string;
  seat: string;
  bus: string;
  slot: "morning" | "afternoon";
  dayLabel: "Today" | "Tomorrow" | "Custom";
};

type CompletedRow = {
  key: string;
  route: string;
  from: string;
  to: string;
  date: string;
  time: string;
  seat: string;
  bus: string;
  slot: "morning" | "afternoon";
  dayLabel: "Today" | "Tomorrow" | "Custom";
};

function dayLabelFromDate(d: Date): "Today" | "Tomorrow" | "Custom" {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTrip = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfTrip - startOfToday) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return "Custom";
}

function formatFromIso(iso: string | undefined): {
  date: string;
  time: string;
  slot: "morning" | "afternoon";
  dayLabel: "Today" | "Tomorrow" | "Custom";
} {
  if (!iso) {
    return { date: "—", time: "—", slot: "morning", dayLabel: "Custom" };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: "—", time: "—", slot: "morning", dayLabel: "Custom" };
  }
  const hour = d.getHours();
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    slot: hour < 12 ? "morning" : "afternoon",
    dayLabel: dayLabelFromDate(d),
  };
}

function formatSeat(seatId: string | undefined): string {
  if (!seatId) return "—";
  const s = String(seatId);
  return s.toLowerCase().includes("seat") ? s : `Seat ${s}`;
}

/** Trip is still a bookable / in-service run (not finished, not cancelled). */
function isActiveScheduledTripStatus(tripStatus: string): boolean {
  const s = tripStatus.toLowerCase();
  return s === "scheduled" || s === "in_progress" || s === "active" || s === "boarding" || s === "live";
}

function cardStatusForTrip(trip: MyBookingItem["trip"], departureIso: string | undefined): UpcomingRow["status"] {
  const st = String(trip?.status ?? "").toLowerCase();
  if (st === "scheduled" && departureIso) {
    const dep = new Date(departureIso).getTime();
    const now = Date.now();
    if (Number.isFinite(dep) && now >= dep - 30 * 60 * 1000 && now <= dep + 6 * 60 * 60 * 1000) {
      return "Live Now";
    }
  }
  return "Upcoming";
}

function splitBookings(items: MyBookingItem[]): { upcoming: UpcomingRow[]; completed: CompletedRow[] } {
  const upcoming: UpcomingRow[] = [];
  const completed: CompletedRow[] = [];

  for (const item of items) {
    const trip = item.trip ?? item.tripSnapshot ?? null;
    if (!trip) continue;

    const tripStatusRaw = String(trip.status ?? "").toLowerCase().trim();
    const tripStatus = tripStatusRaw === "complete" ? "completed" : tripStatusRaw;

    if (tripStatus === "cancelled") continue;

    const route = String(trip.routeCode ?? trip.routeId ?? "—");
    const from = String(trip.originStopName ?? "—");
    const to = String(trip.destinationStopName ?? trip.routeName ?? "—");
    const bus = String(trip.vehicleCode ?? trip.vehicleId ?? "—");
    const seat = formatSeat(item.seatId);

    if (tripStatus === "completed") {
      const whenIso = trip.completedAt ?? trip.arrivalAt ?? trip.departureAt ?? item.updatedAt ?? item.createdAt;
      const { date, time, slot, dayLabel } = formatFromIso(whenIso);
      completed.push({
        key: item.id,
        route,
        from,
        to,
        date,
        time,
        seat,
        bus,
        slot,
        dayLabel,
      });
      continue;
    }

    /** Upcoming tab: confirmed seats only, on trips that are still scheduled / in progress (not completed/cancelled). */
    const bookingConfirmed = item.status === "CONFIRMED";
    if (!bookingConfirmed || !isActiveScheduledTripStatus(tripStatus)) {
      continue;
    }

    const whenIso = trip.departureAt ?? item.createdAt;
    const { date, time, slot, dayLabel } = formatFromIso(whenIso);
    upcoming.push({
      key: item.id,
      tripId: String(item.tripId ?? ""),
      routeTitle: String(trip.routeName ?? `${route} · ${to}`),
      route,
      status: cardStatusForTrip(trip, trip.departureAt),
      from,
      to,
      date,
      time,
      seat,
      bus,
      slot,
      dayLabel,
    });
  }

  return { upcoming, completed };
}

export default function TripsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TripsTab>("Upcoming");
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingRow[]>([]);
  const [completedTrips, setCompletedTrips] = useState<CompletedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const defaultFilters: TripFilters = {
    date: "All",
    busStatus: "All",
    route: "All",
    timeRange: "All",
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState<TripFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<TripFilters>(defaultFilters);

  /** Route codes present in the active tab (from real trip data). */
  const filterRouteCodes = useMemo(() => {
    const rows = activeTab === "Upcoming" ? upcomingTrips : completedTrips;
    return [...new Set(rows.map((r) => r.route).filter((code) => code && code !== "—"))];
  }, [activeTab, upcomingTrips, completedTrips]);

  useEffect(() => {
    setAppliedFilters((prev) => ({ ...prev, busStatus: "All" }));
    setDraftFilters((prev) => ({ ...prev, busStatus: "All" }));
  }, [activeTab]);

  useEffect(() => {
    setAppliedFilters((prev) => {
      if (prev.route !== "All" && !filterRouteCodes.includes(prev.route)) {
        return { ...prev, route: "All" };
      }
      return prev;
    });
  }, [activeTab, filterRouteCodes]);

  const openFilters = useCallback(() => {
    const next = { ...appliedFilters };
    if (next.route !== "All" && !filterRouteCodes.includes(next.route)) {
      next.route = "All";
    }
    setDraftFilters(next);
    setModalVisible(true);
  }, [appliedFilters, filterRouteCodes]);

  const loadBookings = useCallback(async (mode: "full" | "refresh" = "full") => {
    if (mode === "full") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setLoadError(null);
    try {
      const items = await loadPassengerBookingsForTripsScreen();
      const { upcoming, completed } = splitBookings(items);
      setUpcomingTrips(upcoming);
      setCompletedTrips(completed);
    } catch {
      setUpcomingTrips([]);
      setCompletedTrips([]);
      setLoadError("Could not load your trips. Pull to refresh or try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const goToQr = (bookingId: string) => {
    navigation.navigate("QRTicket", { bookingId });
  };

  const goToLiveTracking = () => {
    const first = filteredUpcomingTrips[0];
    if (first?.tripId) {
      navigation.navigate("LiveTracking", { tripId: first.tripId, routeTitle: first.routeTitle });
    } else {
      navigation.navigate("LiveTracking", { tripId: "trip-demo-402", routeTitle: "Demo express" });
    }
  };

  const getTimeLabel = (slot: "morning" | "afternoon") => (slot === "morning" ? "Morning" : "Afternoon");

  const filterLogic = (trip: {
    status?: "Live Now" | "Upcoming" | "In Progress";
    route: string;
    slot: "morning" | "afternoon";
    dayLabel: "Today" | "Tomorrow" | "Custom";
    isCompleted: boolean;
  }) => {
    if (appliedFilters.date !== "All" && trip.dayLabel !== appliedFilters.date) {
      return false;
    }
    if (!trip.isCompleted && appliedFilters.busStatus !== "All" && appliedFilters.busStatus !== trip.status) {
      return false;
    }
    if (appliedFilters.route !== "All" && trip.route !== appliedFilters.route) {
      return false;
    }
    if (appliedFilters.timeRange !== "All" && getTimeLabel(trip.slot) !== appliedFilters.timeRange) {
      return false;
    }
    return true;
  };

  const filteredUpcomingTrips = upcomingTrips.filter((trip) => filterLogic({ ...trip, isCompleted: false }));

  const filteredCompletedTrips = completedTrips.filter((trip) => filterLogic({ ...trip, isCompleted: true }));

  const activeFilterChips = [
    appliedFilters.date !== "All" ? { key: "date", label: `Date: ${appliedFilters.date}` } : null,
    activeTab === "Upcoming" && appliedFilters.busStatus !== "All"
      ? { key: "busStatus" as const, label: `Status: ${appliedFilters.busStatus}` }
      : null,
    appliedFilters.route !== "All" ? { key: "route", label: `Route: ${appliedFilters.route}` } : null,
    appliedFilters.timeRange !== "All" ? { key: "timeRange", label: `Time: ${appliedFilters.timeRange}` } : null,
  ].filter(Boolean) as { key: keyof TripFilters; label: string }[];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadBookings("refresh")}
              tintColor="#74B5F7"
              colors={["#74B5F7"]}
            />
          }
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>My Trips</Text>
            <Pressable
              onPress={openFilters}
              hitSlop={12}
              style={({ pressed }) => [styles.filterIconBtn, pressed && styles.filterIconBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Open trip filters"
            >
              <Ionicons name="funnel-outline" size={20} color="#BBD1EB" />
            </Pressable>
          </View>

          <TabSwitcher
            options={tabs}
            active={activeTab}
            onChange={(nextTab) => {
              setActiveTab(nextTab);
            }}
          />

          {loadError ? <Text style={styles.errorBanner}>{loadError}</Text> : null}
          {loading ? <Text style={styles.loadingText}>Loading trips…</Text> : null}

          {activeFilterChips.length > 0 ? (
            <View style={styles.activeChipsRow}>
              {activeFilterChips.map((chip) => (
                <FilterChip
                  key={chip.key}
                  label={chip.label}
                  active
                  removable
                  onRemove={() => setAppliedFilters((prev) => ({ ...prev, [chip.key]: "All" }))}
                />
              ))}
            </View>
          ) : null}

          {activeTab === "Upcoming" ? (
            <>
              <SectionHeader title="SCHEDULED JOURNEYS" />
              {!loading && filteredUpcomingTrips.length === 0 ? (
                <Text style={styles.emptyText}>No upcoming trips. Book a journey from Home to see it here.</Text>
              ) : null}
              {filteredUpcomingTrips.map((trip) => (
                <TripCard
                  key={trip.key}
                  route={trip.route}
                  status={trip.status}
                  from={trip.from}
                  to={trip.to}
                  date={trip.date}
                  time={trip.time}
                  seat={trip.seat}
                  bus={trip.bus}
                  onViewQr={() => goToQr(trip.key)}
                />
              ))}
              <ScreenCard>
                <Pressable
                  style={({ pressed }) => [styles.liveTrackingRow, pressed && styles.pressed]}
                  onPress={goToLiveTracking}
                >
                  <View style={styles.liveIcon}>
                    <Ionicons name="navigate-outline" size={15} color="#76B1FF" />
                  </View>
                  <View style={styles.liveTextWrap}>
                    <Text style={styles.liveTitle}>Live Tracking</Text>
                    <Text style={styles.liveBody}>
                      Active trip show &quot;Live Now&quot;. Tap the ticket to see real-time bus location and ETA.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#87B8F2" />
                </Pressable>
              </ScreenCard>
            </>
          ) : (
            <>
              <SectionHeader title="PAST JOURNEYS" />
              {!loading && filteredCompletedTrips.length === 0 ? (
                <Text style={styles.emptyText}>No completed trips yet.</Text>
              ) : null}
              {filteredCompletedTrips.map((trip) => (
                <CompletedTripCard
                  key={trip.key}
                  route={trip.route}
                  from={trip.from}
                  to={trip.to}
                  date={trip.date}
                  time={trip.time}
                  seat={trip.seat}
                  bus={trip.bus}
                  onRate={() => navigation.navigate("RateTrip")}
                />
              ))}
            </>
          )}
        </ScrollView>
      </LinearGradient>
      <FilterModal
        visible={modalVisible}
        filterMode={activeTab === "Upcoming" ? "upcoming" : "completed"}
        routeCodes={filterRouteCodes}
        draftFilters={draftFilters}
        onChange={setDraftFilters}
        onClose={() => setModalVisible(false)}
        onApply={() => {
          setAppliedFilters(draftFilters);
          setModalVisible(false);
        }}
        onReset={() => {
          setDraftFilters(defaultFilters);
          setAppliedFilters(defaultFilters);
          setModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: spacing.page, paddingBottom: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "800" },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 52, 78, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(120, 160, 210, 0.35)",
  },
  filterIconBtnPressed: { opacity: 0.85 },
  errorBanner: {
    color: "#FFB4B4",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: "600",
  },
  loadingText: { color: "#A6B8CF", fontSize: 14, marginBottom: 12 },
  emptyText: { color: "#8FA4BC", fontSize: 14, lineHeight: 20, marginBottom: 16 },
  liveTrackingRow: { flexDirection: "row", gap: 10 },
  liveIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#163C67",
    alignItems: "center",
    justifyContent: "center",
  },
  liveTextWrap: { flex: 1 },
  liveTitle: { color: "#EAF4FF", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  liveBody: { color: "#A6B8CF", fontSize: 12, lineHeight: 16 },
  activeChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  pressed: { opacity: 0.82 },
});
