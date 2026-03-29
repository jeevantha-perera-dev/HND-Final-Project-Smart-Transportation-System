import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";
import { searchTrips, type TripSearchItem } from "../../../services/api/trips";
import { formatArrivingHeadline } from "../../../utils/eta";
import { passengerRouteDisplayId, passengerRouteCode } from "../../../utils/busDisplay";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "HomeBusesList">;

function crowdLabel(seats: number) {
  if (seats >= 26) return "Low crowd";
  if (seats >= 13) return "Medium crowd";
  return "High crowd";
}

export default function HomeBusesListScreen({ navigation }: Props) {
  const [items, setItems] = useState<TripSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items: trips } = await searchTrips({ limit: 20, minSeats: 1 });
      setItems(trips);
    } catch {
      setError("Could not load upcoming trips. Check your connection and API.");
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Upcoming trips</Text>
          <Pressable onPress={() => void load()} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="#5EB3F6" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#5EB3F6" />
            <Text style={styles.hint}>Loading scheduled buses…</Text>
          </View>
        ) : null}

        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading &&
          !error &&
          items.map((bus) => (
            <View key={bus.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.route}>
                  {`${passengerRouteCode(bus.routeId, bus.shortRouteId)} · ${bus.routeName}`}
                </Text>
                <Text style={styles.eta}>{formatArrivingHeadline(bus.arrivalMins)}</Text>
              </View>
              <Text style={styles.meta}>{crowdLabel(bus.seatsLeft)}</Text>
              <Text style={styles.fare}>{`LKR ${bus.price.toFixed(0)} · ${bus.seatsLeft} seats`}</Text>
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
                <Ionicons name="chevron-forward" size={14} color="#D9EBFF" />
              </Pressable>
            </View>
          ))}

        {!loading && !error && items.length === 0 ? (
          <Text style={styles.empty}>No scheduled trips found. Run backend seed (routes → seed:trips) and try again.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  content: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800" },
  center: { paddingVertical: 24, alignItems: "center", gap: 8 },
  hint: { color: "#8EA3BA", fontSize: 13 },
  error: { color: "#FF8A8A", marginBottom: 12, fontWeight: "600" },
  empty: { color: "#8EA3BA", fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  route: { color: "#EAF4FF", fontSize: 16, fontWeight: "800", flex: 1, marginRight: 8 },
  eta: { color: "#5EB3F6", fontSize: 13, fontWeight: "800" },
  meta: { color: "#8EA3BA", fontSize: 12, marginTop: 4 },
  fare: { color: "#C5D6E8", fontSize: 12, marginTop: 4, fontWeight: "600" },
  cta: { marginTop: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5 },
  ctaText: { color: "#CFE4F9", fontSize: 12, fontWeight: "700" },
});
