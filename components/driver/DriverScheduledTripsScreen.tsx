import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "../../services/api/client";
import { cancelTrip, DriverScheduledTrip, getMyScheduledTrips } from "../../services/api/trips";

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
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

  const confirmCancelTrip = useCallback(
    (trip: DriverScheduledTrip) => {
      Alert.alert(
        "Cancel trip",
        `Cancel this scheduled trip?\n\n${trip.routeName}\nPassengers will no longer see it for booking.`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Cancel trip",
            style: "destructive",
            onPress: () => {
              void (async () => {
                setCancellingId(trip.id);
                try {
                  await cancelTrip(trip.id);
                  await loadTrips();
                } catch (err) {
                  const msg =
                    err instanceof ApiError ? err.message : "Could not cancel the trip. Try again.";
                  Alert.alert("Cancel failed", msg);
                } finally {
                  setCancellingId(null);
                }
              })();
            },
          },
        ]
      );
    },
    [loadTrips]
  );

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

              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    pressed && styles.cancelBtnPressed,
                    cancellingId === trip.id && styles.btnDisabled,
                  ]}
                  onPress={() => confirmCancelTrip(trip)}
                  disabled={cancellingId !== null}
                >
                  <Ionicons name="ban-outline" size={18} color="#FF8A9B" />
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.startBtn, cancellingId === trip.id && styles.btnDisabled]}
                  onPress={() => onSelectTrip?.(trip)}
                  disabled={cancellingId !== null}
                >
                  <Text style={styles.startBtnText}>Start This Trip</Text>
                </Pressable>
              </View>
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
  actionsRow: { marginTop: 14, flexDirection: "row", gap: 12, alignItems: "stretch" },
  cancelBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 138, 155, 0.42)",
    backgroundColor: "rgba(45, 28, 36, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  cancelBtnPressed: {
    backgroundColor: "rgba(58, 32, 42, 0.98)",
    borderColor: "rgba(255, 160, 172, 0.55)",
    transform: [{ scale: 0.98 }],
  },
  cancelBtnText: {
    color: "#FFD0D8",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  startBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#66AEF2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A9EE8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  startBtnText: { color: "#0D2135", fontSize: 14, fontWeight: "800", letterSpacing: 0.2 },
  btnDisabled: { opacity: 0.45 },
});
