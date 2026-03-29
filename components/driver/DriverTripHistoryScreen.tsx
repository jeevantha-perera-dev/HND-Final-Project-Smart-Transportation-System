import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "../../services/api/client";
import { getMyTripHistory, type DriverHistoryTrip } from "../../services/api/trips";

type DriverTripHistoryScreenProps = {
  onBack?: () => void;
};

const DATE_RANGE_DAYS = [7, 30] as const;
type RangeDays = (typeof DATE_RANGE_DAYS)[number];

const STATUS_FILTERS = ["All", "Completed", "Cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function formatHistoryWhen(iso: string | null | undefined) {
  if (!iso) return "—";
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

function displayStatus(status: string): "Completed" | "Cancelled" {
  const s = status.toLowerCase();
  if (s === "cancelled") return "Cancelled";
  return "Completed";
}

export default function DriverTripHistoryScreen({ onBack }: DriverTripHistoryScreenProps) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);
  const [status, setStatus] = useState<StatusFilter>("All");
  const [items, setItems] = useState<DriverHistoryTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { items: next } = await getMyTripHistory({ days: rangeDays });
      setItems(next);
    } catch (e) {
      setItems([]);
      setLoadError(e instanceof ApiError ? e.message : "Could not load trip history.");
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleTrips = useMemo(() => {
    return items.filter((trip) => {
      if (status === "All") return true;
      const s = trip.status.toLowerCase();
      if (status === "Completed") return s === "completed";
      if (status === "Cancelled") return s === "cancelled";
      return true;
    });
  }, [items, status]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E4EEF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Trip History</Text>
      </View>
      <View style={styles.separator} />

      <View style={styles.toolbar}>
        <View style={styles.rangeWrap}>
          {DATE_RANGE_DAYS.map((d) => {
            const active = d === rangeDays;
            const label = d === 7 ? "7 Days" : "30 Days";
            return (
              <Pressable
                key={d}
                style={[styles.rangeBtn, active && styles.rangeBtnActive]}
                onPress={() => setRangeDays(d)}
              >
                <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.filters}>
        {STATUS_FILTERS.map((item) => {
          const active = item === status;
          return (
            <Pressable
              key={item}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatus(item)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#67A9EA" />
            <Text style={styles.loadingText}>Loading your trips…</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void load()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : visibleTrips.length === 0 ? (
          <Text style={styles.emptyText}>
            No trips in the last {rangeDays} days for this filter. Complete a trip from the live trip
            screen to see it here.
          </Text>
        ) : (
          visibleTrips.map((trip) => {
            const label = displayStatus(trip.status);
            const routeLine = `Route ${trip.routeCode} · ${trip.routeName}`;
            const stopsLine =
              trip.originStopName && trip.destinationStopName
                ? `${trip.originStopName} → ${trip.destinationStopName}`
                : "";
            const whenIso = trip.completedAt ?? trip.departureAt;
            const earningsText =
              trip.status.toLowerCase() === "completed"
                ? `LKR ${trip.tripEarningsLkr.toFixed(0)}`
                : "—";
            const boardedText =
              trip.status.toLowerCase() === "completed" ? String(trip.boardedCount) : "—";

            return (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.tripMain}>
                  <View style={styles.tripTop}>
                    <Text style={styles.tripId} numberOfLines={1}>
                      {trip.id}
                    </Text>
                    <Text
                      style={[
                        styles.tripStatus,
                        label === "Completed" ? styles.statusCompleted : styles.statusCancelled,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                  <Text style={styles.route}>{routeLine}</Text>
                  {stopsLine ? (
                    <Text style={styles.stops} numberOfLines={2}>
                      {stopsLine}
                    </Text>
                  ) : null}
                  <Text style={styles.date}>{formatHistoryWhen(whenIso)}</Text>
                  <View style={styles.metricsRow}>
                    <Metric label="Earnings" value={earningsText} />
                    <Metric label="Boarded" value={boardedText} />
                    <View style={styles.vehicleChip}>
                      <Ionicons name="bus-outline" size={14} color="#87B9FF" />
                      <Text style={styles.vehicleChipText} numberOfLines={1}>
                        {trip.vehicleCode}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D" },
  header: { height: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1E2D3F" },
  toolbar: { paddingHorizontal: 14, paddingTop: 12 },
  rangeWrap: {
    height: 36,
    borderRadius: 18,
    backgroundColor: "#161F2B",
    borderWidth: 1,
    borderColor: "#29384A",
    flexDirection: "row",
    padding: 3,
  },
  rangeBtn: { flex: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rangeBtnActive: { backgroundColor: "#67A9EA" },
  rangeText: { color: "#9CB2C7", fontSize: 12, fontWeight: "700" },
  rangeTextActive: { color: "#1E4369" },
  filters: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14 },
  filterChip: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#314255",
    backgroundColor: "#141D29",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: "#123D6B", borderColor: "#2C5D8E" },
  filterText: { color: "#9FB4C8", fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: "#D9EBFF" },
  content: { padding: 14, paddingBottom: 24, flexGrow: 1 },
  centered: { paddingVertical: 28, alignItems: "center", gap: 12 },
  loadingText: { color: "#9AB0C6", fontSize: 14, fontWeight: "600" },
  errorText: { color: "#E88A8A", fontSize: 14, fontWeight: "600", textAlign: "center" },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1A3A5C",
    borderWidth: 1,
    borderColor: "#2C5D8E",
  },
  retryBtnText: { color: "#B8D9FF", fontSize: 14, fontWeight: "700" },
  emptyText: { color: "#9AB0C6", fontSize: 14, lineHeight: 20, fontWeight: "600" },
  tripCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263648",
    backgroundColor: "#1A232F",
    marginBottom: 10,
    overflow: "hidden",
  },
  tripMain: { padding: 12 },
  tripTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  tripId: { color: "#7FA9D5", fontSize: 12, fontWeight: "700", flex: 1 },
  tripStatus: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  statusCompleted: { color: "#81E3AA", backgroundColor: "rgba(31,120,66,0.35)" },
  statusCancelled: { color: "#F09AA9", backgroundColor: "rgba(112,31,46,0.45)" },
  route: { color: "#F1F8FF", fontSize: 16, fontWeight: "800", marginTop: 4 },
  stops: { color: "#8FA9C4", fontSize: 13, fontWeight: "600", marginTop: 4 },
  date: { color: "#A8BDCF", fontSize: 12, marginTop: 6, fontWeight: "600" },
  metricsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  metricBlock: { flex: 1 },
  metricLabel: { color: "#90A5BC", fontSize: 11, fontWeight: "600" },
  metricValue: { color: "#EAF3FC", fontSize: 14, fontWeight: "800", marginTop: 2 },
  vehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 120,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#121A26",
    borderWidth: 1,
    borderColor: "#243044",
  },
  vehicleChipText: { color: "#B8D1EA", fontSize: 12, fontWeight: "700", flex: 1 },
});
