import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DriverPassengerDetails } from "./DriverQueueDetailsScreen";

type HistoryStatus = "Completed" | "Delayed" | "Cancelled";

type HistoryTrip = {
  id: string;
  route: string;
  date: string;
  earnings: string;
  boarded: number;
  status: HistoryStatus;
  samplePassenger: DriverPassengerDetails;
};

type DriverTripHistoryScreenProps = {
  onBack?: () => void;
  onOpenQueueDetails?: (passenger: DriverPassengerDetails) => void;
};

const TRIPS: HistoryTrip[] = [
  {
    id: "TR-991",
    route: "Route 402 • Downtown → Central",
    date: "Today • 08:30 AM",
    earnings: "$34.20",
    boarded: 31,
    status: "Completed",
    samplePassenger: { id: "q-1", name: "Julian Richards", type: "Adult", tickets: "1 Ticket(s)" },
  },
  {
    id: "TR-988",
    route: "Route 115 • Tech Park Loop",
    date: "Yesterday • 06:15 PM",
    earnings: "$26.10",
    boarded: 22,
    status: "Delayed",
    samplePassenger: { id: "q-2", name: "Maria Thompson", type: "Student", tickets: "2 Ticket(s)" },
  },
  {
    id: "TR-982",
    route: "Route 089 • Airport Connector",
    date: "Mar 16 • 04:20 PM",
    earnings: "$18.90",
    boarded: 14,
    status: "Cancelled",
    samplePassenger: { id: "q-3", name: "Sarah Chen", type: "Adult", tickets: "1 Ticket(s)" },
  },
];

const DATE_RANGE = ["7 Days", "30 Days"] as const;
const STATUS_FILTERS = ["All", "Completed", "Delayed", "Cancelled"] as const;

export default function DriverTripHistoryScreen({
  onBack,
  onOpenQueueDetails,
}: DriverTripHistoryScreenProps) {
  const [range, setRange] = useState<(typeof DATE_RANGE)[number]>("7 Days");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const visibleTrips = useMemo(() => {
    return TRIPS.filter((trip) => (status === "All" ? true : trip.status === status));
  }, [status]);

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
          {DATE_RANGE.map((item) => {
            const active = item === range;
            return (
              <Pressable
                key={item}
                style={[styles.rangeBtn, active && styles.rangeBtnActive]}
                onPress={() => setRange(item)}
              >
                <Text style={[styles.rangeText, active && styles.rangeTextActive]}>{item}</Text>
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
        {visibleTrips.map((trip) => {
          const expanded = expandedTripId === trip.id;
          return (
            <View key={trip.id} style={styles.tripCard}>
              <Pressable
                style={styles.tripMain}
                onPress={() => setExpandedTripId(expanded ? null : trip.id)}
              >
                <View style={styles.tripTop}>
                  <Text style={styles.tripId}>{trip.id}</Text>
                  <Text
                    style={[
                      styles.tripStatus,
                      trip.status === "Completed"
                        ? styles.statusCompleted
                        : trip.status === "Delayed"
                          ? styles.statusDelayed
                          : styles.statusCancelled,
                    ]}
                  >
                    {trip.status}
                  </Text>
                </View>
                <Text style={styles.route}>{trip.route}</Text>
                <Text style={styles.date}>{trip.date}</Text>
                <View style={styles.metricsRow}>
                  <Metric label="Earnings" value={trip.earnings} />
                  <Metric label="Boarded" value={`${trip.boarded}`} />
                  <Ionicons
                    name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
                    size={18}
                    color="#A4B8CC"
                  />
                </View>
              </Pressable>

              {expanded ? (
                <View style={styles.expandedWrap}>
                  <Pressable
                    style={styles.inlineAction}
                    onPress={() => onOpenQueueDetails?.(trip.samplePassenger)}
                  >
                    <Ionicons name="people-outline" size={15} color="#7FB3E4" />
                    <Text style={styles.inlineActionText}>Open Queue Details</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
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
  content: { padding: 14, paddingBottom: 24 },
  tripCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263648",
    backgroundColor: "#1A232F",
    marginBottom: 10,
    overflow: "hidden",
  },
  tripMain: { padding: 12 },
  tripTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tripId: { color: "#7FA9D5", fontSize: 12, fontWeight: "700" },
  tripStatus: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  statusCompleted: { color: "#81E3AA", backgroundColor: "rgba(31,120,66,0.35)" },
  statusDelayed: { color: "#FFD37C", backgroundColor: "rgba(107,80,23,0.45)" },
  statusCancelled: { color: "#F09AA9", backgroundColor: "rgba(112,31,46,0.45)" },
  route: { color: "#F1F8FF", fontSize: 16, fontWeight: "800", marginTop: 4 },
  date: { color: "#A8BDCF", fontSize: 12, marginTop: 2, fontWeight: "600" },
  metricsRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricLabel: { color: "#90A5BC", fontSize: 11, fontWeight: "600" },
  metricValue: { color: "#EAF3FC", fontSize: 14, fontWeight: "800", marginTop: 2 },
  expandedWrap: { borderTopWidth: 1, borderTopColor: "#2A3A4D", padding: 12 },
  inlineAction: { flexDirection: "row", alignItems: "center", gap: 7 },
  inlineActionText: { color: "#8FBBE5", fontSize: 13, fontWeight: "700" },
});
