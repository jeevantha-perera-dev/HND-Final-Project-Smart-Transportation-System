import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IncidentStatus = "Open" | "Reviewed" | "Resolved";

type IncidentItem = {
  id: string;
  title: string;
  route: string;
  reportedAt: string;
  status: IncidentStatus;
  details: string;
};

type DriverIncidentHistoryScreenProps = {
  onBack?: () => void;
};

const INCIDENTS: IncidentItem[] = [
  {
    id: "IN-210",
    title: "Passenger disturbance",
    route: "Route 402 • Central",
    reportedAt: "Today • 09:02 AM",
    status: "Open",
    details: "Passenger argument near rear door. Situation controlled by driver.",
  },
  {
    id: "IN-201",
    title: "Minor brake noise",
    route: "Route 115 • Loop",
    reportedAt: "Mar 18 • 06:47 PM",
    status: "Reviewed",
    details: "Intermittent squeaking under low speed braking near station approach.",
  },
  {
    id: "IN-193",
    title: "Mirror replacement request",
    route: "Route 089 • Airport",
    reportedAt: "Mar 15 • 03:11 PM",
    status: "Resolved",
    details: "Left mirror cracked by roadside debris. Fleet maintenance completed.",
  },
];

const FILTERS = ["All", "Open", "Reviewed", "Resolved"] as const;

export default function DriverIncidentHistoryScreen({
  onBack,
}: DriverIncidentHistoryScreenProps) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [activeId, setActiveId] = useState<string | null>(INCIDENTS[0].id);

  const list = useMemo(() => {
    return INCIDENTS.filter((item) => (filter === "All" ? true : item.status === filter));
  }, [filter]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E4EEF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Incident History</Text>
      </View>
      <View style={styles.separator} />

      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const active = filter === item;
          return (
            <Pressable
              key={item}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {list.map((incident) => {
          const expanded = activeId === incident.id;
          return (
            <Pressable
              key={incident.id}
              style={styles.incidentCard}
              onPress={() => setActiveId(expanded ? null : incident.id)}
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.incidentId}>{incident.id}</Text>
                  <Text style={styles.incidentTitle}>{incident.title}</Text>
                  <Text style={styles.route}>{incident.route}</Text>
                </View>
                <Text
                  style={[
                    styles.status,
                    incident.status === "Open"
                      ? styles.statusOpen
                      : incident.status === "Reviewed"
                        ? styles.statusReviewed
                        : styles.statusResolved,
                  ]}
                >
                  {incident.status}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color="#91A9C2" />
                <Text style={styles.metaText}>{incident.reportedAt}</Text>
              </View>

              {expanded ? (
                <View style={styles.detailsWrap}>
                  <Text style={styles.detailsText}>{incident.details}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D" },
  header: { height: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1E2D3F" },
  filterRow: { marginTop: 12, flexDirection: "row", gap: 8, paddingHorizontal: 14 },
  filterChip: {
    height: 31,
    borderRadius: 16,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#324456",
    backgroundColor: "#141D29",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: "#123D6B", borderColor: "#2D6193" },
  filterText: { color: "#9FB4C8", fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#D7EBFF" },
  content: { padding: 14, paddingBottom: 24 },
  incidentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#28384A",
    backgroundColor: "#1A232F",
    padding: 12,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  incidentId: { color: "#84ABD4", fontSize: 12, fontWeight: "700" },
  incidentTitle: { color: "#F1F8FF", fontSize: 16, fontWeight: "800", marginTop: 3 },
  route: { color: "#A8BDCF", fontSize: 12, marginTop: 2, fontWeight: "600" },
  status: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  statusOpen: { color: "#F09AA9", backgroundColor: "rgba(112,31,46,0.45)" },
  statusReviewed: { color: "#FFD37C", backgroundColor: "rgba(107,80,23,0.45)" },
  statusResolved: { color: "#82E3AC", backgroundColor: "rgba(31,120,66,0.35)" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  metaText: { color: "#96ABBF", fontSize: 12, fontWeight: "600" },
  detailsWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A3A4D",
    paddingTop: 9,
  },
  detailsText: { color: "#C5D7E9", fontSize: 13, lineHeight: 18, fontWeight: "600" },
});
