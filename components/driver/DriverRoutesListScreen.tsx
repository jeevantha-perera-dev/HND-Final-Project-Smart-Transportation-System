import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type DriverRouteSummary = {
  id: string;
  name: string;
  vehicle: string;
  departure: string;
  eta: string;
  status: "Active" | "Upcoming" | "Completed";
};

type DriverRoutesListScreenProps = {
  onBack?: () => void;
  onOpenRoute?: (route: DriverRouteSummary) => void;
  onOpenTripHistory?: () => void;
};

const ROUTES: DriverRouteSummary[] = [
  {
    id: "R-402",
    name: "Route 402 • Central Station",
    vehicle: "BUS-9920",
    departure: "08:30 AM",
    eta: "09:15 AM",
    status: "Active",
  },
  {
    id: "R-115",
    name: "Route 115 • Tech Park Loop",
    vehicle: "BUS-7714",
    departure: "10:00 AM",
    eta: "10:40 AM",
    status: "Upcoming",
  },
  {
    id: "R-089",
    name: "Route 089 • Airport Connector",
    vehicle: "BUS-6612",
    departure: "06:00 AM",
    eta: "06:55 AM",
    status: "Completed",
  },
];

const FILTERS: ("All" | DriverRouteSummary["status"])[] = [
  "All",
  "Active",
  "Upcoming",
  "Completed",
];

export default function DriverRoutesListScreen({
  onBack,
  onOpenRoute,
  onOpenTripHistory,
}: DriverRoutesListScreenProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filteredRoutes = useMemo(() => {
    return ROUTES.filter((route) => {
      const filterMatch = filter === "All" ? true : route.status === filter;
      const text = `${route.id} ${route.name} ${route.vehicle}`.toLowerCase();
      const queryMatch = text.includes(query.trim().toLowerCase());
      return filterMatch && queryMatch;
    });
  }, [filter, query]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E3EDF8" />
        </Pressable>
        <Text style={styles.headerTitle}>All Routes</Text>
        <Pressable style={styles.iconBtn} onPress={onOpenTripHistory}>
          <Ionicons name="time-outline" size={20} color="#65AFFF" />
        </Pressable>
      </View>

      <View style={styles.separator} />

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color="#87A1BB" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search route, vehicle, id"
          placeholderTextColor="#8399B1"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const active = item === filter;
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
        {filteredRoutes.map((route) => (
          <Pressable
            key={route.id}
            style={styles.routeCard}
            onPress={() => onOpenRoute?.(route)}
          >
            <View style={styles.routeTop}>
              <Text style={styles.routeId}>{route.id}</Text>
              <Text
                style={[
                  styles.statusPill,
                  route.status === "Active"
                    ? styles.statusActive
                    : route.status === "Upcoming"
                      ? styles.statusUpcoming
                      : styles.statusCompleted,
                ]}
              >
                {route.status}
              </Text>
            </View>
            <Text style={styles.routeName}>{route.name}</Text>

            <View style={styles.metaRow}>
              <Meta icon="bus-outline" text={route.vehicle} />
              <Meta icon="play-circle-outline" text={`Dep ${route.departure}`} />
              <Meta icon="flag-outline" text={`ETA ${route.eta}`} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color="#87A9CD" />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D" },
  header: { height: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1E2D3F" },
  searchWrap: {
    marginTop: 12,
    marginHorizontal: 14,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#151E2A",
    borderWidth: 1,
    borderColor: "#243446",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 8, color: "#E8F1FB", fontSize: 14 },
  filterRow: { marginTop: 10, flexDirection: "row", paddingHorizontal: 14, gap: 8 },
  filterChip: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2D3E52",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#141D2A",
  },
  filterChipActive: { backgroundColor: "#123D6B", borderColor: "#2D6193" },
  filterText: { color: "#97ACC1", fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#D8EBFF" },
  content: { padding: 14, paddingBottom: 24 },
  routeCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243549",
    backgroundColor: "#18212D",
    padding: 12,
    marginBottom: 10,
  },
  routeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeId: { color: "#7FA9D5", fontSize: 12, fontWeight: "800" },
  statusPill: {
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
  },
  statusActive: { color: "#7EE3A6", backgroundColor: "rgba(31,120,66,0.35)" },
  statusUpcoming: { color: "#8AC2FF", backgroundColor: "rgba(20,64,112,0.5)" },
  statusCompleted: { color: "#A9BBCD", backgroundColor: "rgba(79,91,107,0.5)" },
  routeName: { color: "#F1F8FF", fontSize: 17, fontWeight: "800", marginTop: 4 },
  metaRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#A8BBCE", fontSize: 12, fontWeight: "600" },
});
