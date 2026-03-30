import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";
import { colors } from "../theme";
import { searchTrips, type TripSearchItem } from "../../../services/api/trips";
import { formatArrivingHeadline } from "../../../utils/eta";
import { passengerRouteDisplayId, passengerRouteCode } from "../../../utils/busDisplay";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "NearbyStops">;

const TRIPS_LIMIT = 50;

function crowdLabel(seats: number) {
  if (seats >= 26) return "Low crowd";
  if (seats >= 13) return "Medium crowd";
  return "High crowd";
}

function pickAreaHint(geo: Location.LocationGeocodedAddress | undefined): string | undefined {
  if (!geo) return undefined;
  const parts = [
    geo.city,
    geo.subregion,
    geo.district,
    geo.region,
    geo.name,
  ]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  return parts[0] || undefined;
}

export default function NearbyStopsScreen({ navigation }: Props) {
  const [items, setItems] = useState<TripSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaHint, setAreaHint] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAreaHint(null);

    const tripsPromise = searchTrips({ limit: TRIPS_LIMIT, minSeats: 1 });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const geo = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const hint = pickAreaHint(geo[0]);
        if (hint) setAreaHint(hint);
      }
    } catch {
      /* optional context only */
    }

    try {
      const { items: trips } = await tripsPromise;
      const sorted = [...trips].sort((a, b) => (a.arrivalMins ?? 0) - (b.arrivalMins ?? 0));
      setItems(sorted);
    } catch {
      setError("Could not load buses. Check your connection and try refresh.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Nearby buses</Text>
            <Pressable onPress={() => void load()} style={styles.iconBtn} hitSlop={10} disabled={loading}>
              <Ionicons name="refresh" size={20} color={colors.blueSoft} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Up to {TRIPS_LIMIT} scheduled trips with seats, sorted by soonest departure. Location shows your area when
            permission is on.
          </Text>

          {areaHint ? (
            <View style={styles.areaPill}>
              <Ionicons name="navigate-outline" size={14} color={colors.blueSoft} />
              <Text style={styles.areaPillText} numberOfLines={1}>
                Near {areaHint}
              </Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.blueSoft} />
              <Text style={styles.hint}>Loading nearest buses…</Text>
            </View>
          ) : null}

          {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

          {!loading &&
            !error &&
            items.map((bus, index) => (
              <View key={bus.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.routeBlock}>
                    <Text style={styles.route} numberOfLines={2}>
                      {`${passengerRouteCode(bus.routeId, bus.shortRouteId)} · ${bus.routeName}`}
                    </Text>
                    {index === 0 ? <Text style={styles.soonest}>Soonest</Text> : null}
                  </View>
                  <Text style={styles.eta}>{formatArrivingHeadline(bus.arrivalMins)}</Text>
                </View>
                <Text style={styles.dest} numberOfLines={2}>
                  → {bus.destinationStopName?.trim() || "Destination"}
                </Text>
                <Text style={styles.meta}>{crowdLabel(bus.seatsLeft)}</Text>
                <Text style={styles.fare}>{`LKR ${bus.price.toFixed(0)} · ${bus.seatsLeft} seats left`}</Text>
                <Pressable
                  style={styles.cta}
                  onPress={() =>
                    navigation.navigate("SeatSelection", {
                      tripId: bus.id,
                      busId: passengerRouteDisplayId(bus.routeId, bus.shortRouteId),
                      routeName: bus.routeName,
                      price: `LKR ${bus.price.toFixed(0)}`,
                    })
                  }
                >
                  <Text style={styles.ctaText}>Book seats</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textPrimary} />
                </Pressable>
              </View>
            ))}

          {!loading && !error && items.length === 0 ? (
            <Text style={styles.empty}>
              No scheduled buses with available seats right now. Ask your operator to add trips, then pull to refresh.
            </Text>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", flex: 1, textAlign: "center" },
  subtitle: { color: colors.textMuted, fontSize: 12, marginBottom: 12, lineHeight: 17 },
  areaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 14,
    maxWidth: "100%",
  },
  areaPillText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", flex: 1 },
  center: { paddingVertical: 24, alignItems: "center", gap: 8 },
  hint: { color: colors.textSecondary, fontSize: 13 },
  error: { color: "#FCA5A5", marginBottom: 12, fontWeight: "600", lineHeight: 20 },
  empty: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  routeBlock: { flex: 1, minWidth: 0 },
  route: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  soonest: {
    marginTop: 6,
    color: colors.blueSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  eta: { color: colors.blueSoft, fontSize: 13, fontWeight: "800", flexShrink: 0 },
  dest: { color: colors.textSecondary, fontSize: 13, marginTop: 8, lineHeight: 18 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  fare: { color: colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: "600" },
  cta: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.blue,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
});
