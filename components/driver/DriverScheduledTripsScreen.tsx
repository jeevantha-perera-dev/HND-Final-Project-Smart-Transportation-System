import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "../../services/api/client";
import { DriverScheduledTrip, getMyScheduledTrips } from "../../services/api/trips";

type DriverScheduledTripsScreenProps = {
  onBack?: () => void;
  onSelectTrip?: (trip: DriverScheduledTrip) => void;
  onOpenSchedule?: () => void;
};

export default function DriverScheduledTripsScreen({
  onBack,
  onSelectTrip,
  onOpenSchedule,
}: DriverScheduledTripsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DriverScheduledTrip[]>([]);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyScheduledTrips();
      setItems(data.items);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load scheduled trips.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E2EDF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Start Scheduled Trip</Text>
        <Pressable style={styles.iconBtn} onPress={loadTrips}>
          <Ionicons name="refresh-outline" size={20} color="#8FC1F3" />
        </Pressable>
      </View>
      <View style={styles.separator} />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#67A9EA" />
          <Text style={styles.centerText}>Loading your scheduled trips...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="warning-outline" size={24} color="#FF9AA5" />
          <Text style={styles.errorTitle}>Unable to Load Trips</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={loadTrips}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="calendar-outline" size={24} color="#8FC1F3" />
          <Text style={styles.emptyTitle}>No Scheduled Trips Found</Text>
          <Text style={styles.centerText}>Create a new schedule first, then come back to start it.</Text>
          <Pressable style={styles.scheduleBtn} onPress={onOpenSchedule}>
            <Text style={styles.scheduleBtnText}>Schedule a Trip</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {items.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.cardTop}>
                <Text style={styles.routeCode}>{trip.routeCode}</Text>
                <Text style={styles.departure}>{new Date(trip.departureAt).toLocaleString()}</Text>
              </View>
              <Text style={styles.routeName}>{trip.routeName}</Text>

              <View style={styles.metaRow}>
                <Meta icon="bus-outline" text={trip.vehicleCode} />
                <Meta icon="people-outline" text={`${trip.seatsAvailable} seats`} />
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="navigate-outline" size={14} color="#85B8E8" />
                <Text style={styles.locationText}>{trip.originStopName}</Text>
                <Ionicons name="arrow-forward" size={14} color="#6E96BF" />
                <Text style={styles.locationText}>{trip.destinationStopName}</Text>
              </View>

              <Pressable style={styles.startBtn} onPress={() => onSelectTrip?.(trip)}>
                <Text style={styles.startBtnText}>Start This Trip</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color="#85B8E8" />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D" },
  header: { height: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: "#EAF2FC", fontSize: 20, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1E2D3F" },
  content: { padding: 14, paddingBottom: 24 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  centerText: {
    color: "#A9BED3",
    fontSize: 14,
    textAlign: "center",
  },
  errorTitle: {
    color: "#FFE2E7",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyTitle: {
    color: "#D8EAFC",
    fontSize: 18,
    fontWeight: "800",
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#27384D",
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#EAF3FC", fontWeight: "700" },
  scheduleBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#66AEF2",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleBtnText: {
    color: "#153453",
    fontWeight: "800",
  },
  tripCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243549",
    backgroundColor: "#18212D",
    padding: 12,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeCode: { color: "#7FA9D5", fontSize: 12, fontWeight: "800" },
  departure: { color: "#A7BED3", fontSize: 12, fontWeight: "600" },
  routeName: { color: "#F1F8FF", fontSize: 17, fontWeight: "800", marginTop: 4 },
  metaRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#A8BBCE", fontSize: 12, fontWeight: "600" },
  locationRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { color: "#C9DBEC", fontSize: 12, fontWeight: "600", flexShrink: 1 },
  startBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#66AEF2",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: { color: "#1B3652", fontSize: 14, fontWeight: "800" },
});
