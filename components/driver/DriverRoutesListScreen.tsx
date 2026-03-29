import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { listRoutes, type CatalogRoute } from "../../services/api/routes";

export type DriverRouteSummary = {
  id: string;
  routeId: string;
  name: string;
  vehicle: string;
  departure: string;
  eta: string;
  status: "Active" | "Upcoming" | "Completed";
  origin?: string;
  destination?: string;
  stops?: string[];
  departureTime?: string;
  arrivalTime?: string;
};

function mapCatalogRoute(cat: CatalogRoute): DriverRouteSummary {
  const safe = cat.routeId.replace(/[^\w.-]/g, "_");
  return {
    id: cat.id,
    routeId: cat.routeId,
    name: cat.routeName || `${cat.origin} → ${cat.destination}`,
    vehicle: `BUS-${safe}`,
    departure: cat.departureTime || "—",
    eta: cat.arrivalTime || "—",
    status: "Upcoming",
    origin: cat.origin,
    destination: cat.destination,
    stops: cat.stops,
    departureTime: cat.departureTime,
    arrivalTime: cat.arrivalTime,
  };
}

type DriverRoutesListScreenProps = {
  onBack?: () => void;
  onOpenRoute?: (route: DriverRouteSummary) => void;
  onOpenTripHistory?: () => void;
};

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
  const [routes, setRoutes] = useState<DriverRouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { items } = await listRoutes({ limit: 150 });
        if (!mounted) return;
        setRoutes(items.map(mapCatalogRoute));
        setLoadError(null);
      } catch {
        if (!mounted) return;
        setRoutes([]);
        setLoadError("Could not load routes. Check API and Firestore seed.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const filterMatch = filter === "All" ? true : route.status === filter;
      const text = `${route.routeId} ${route.name} ${route.vehicle}`.toLowerCase();
      const queryMatch = text.includes(query.trim().toLowerCase());
      return filterMatch && queryMatch;
    });
  }, [filter, query, routes]);

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
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color="#8AC2FF" />
            <Text style={styles.loadingText}>Loading route catalog…</Text>
          </View>
        ) : null}
        {!loading && loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
        {!loading && !loadError && filteredRoutes.length === 0 ? (
          <Text style={styles.emptyText}>No routes match your filters.</Text>
        ) : null}
        {filteredRoutes.map((route) => (
          <Pressable
            key={route.id}
            style={styles.routeCard}
            onPress={() => onOpenRoute?.(route)}
          >
            <View style={styles.routeTop}>
              <Text style={styles.routeId}>{route.routeId}</Text>
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
  loadingWrap: { paddingVertical: 24, alignItems: "center", gap: 8 },
  loadingText: { color: "#97ACC1", fontSize: 13 },
  errorText: { color: "#FF8A8A", paddingVertical: 12, fontWeight: "600" },
  emptyText: { color: "#97ACC1", paddingVertical: 12 },
});
