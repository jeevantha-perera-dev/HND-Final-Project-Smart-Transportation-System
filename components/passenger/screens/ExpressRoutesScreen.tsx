import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listRoutes, type CatalogRoute } from "../../../services/api/routes";
import { filterExpressRoutes } from "../../../services/routeOriginGroups";
import { passengerRouteDisplayId } from "../../../utils/busDisplay";
import { PassengerHomeStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "ExpressRoutes">;

export default function ExpressRoutesScreen({ navigation }: Props) {
  const [routes, setRoutes] = useState<CatalogRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await listRoutes({ limit: 150 });
      setRoutes(filterExpressRoutes(items));
    } catch {
      setError("Could not load routes. Check your connection and API.");
      setRoutes([]);
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
          <Text style={styles.title}>Express Routes</Text>
          <Pressable onPress={() => void load()} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="#5EB3F6" />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#5EB3F6" />
            <Text style={styles.hint}>Loading from your route catalog…</Text>
          </View>
        ) : null}

        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading &&
          !error &&
          routes.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.routeName}>{item.routeName || item.routeId}</Text>
              <Text style={styles.routeCode} numberOfLines={1}>
                {passengerRouteDisplayId(item.routeId, item.shortRouteId)}
              </Text>
              <Text style={styles.meta} numberOfLines={2}>
                {item.origin} → {item.destination}
              </Text>
              <View style={styles.durationPill}>
                <Ionicons name="time-outline" size={12} color="#B9D9F8" style={styles.durationIcon} />
                <Text style={styles.durationText}>
                  {item.durationMinutes > 0 ? `${Math.round(item.durationMinutes)} min` : "—"}
                  {item.distanceKm > 0 ? ` · ${item.distanceKm.toFixed(0)} km` : ""}
                </Text>
              </View>
              <Text style={styles.operator} numberOfLines={1}>
                {item.operatorName || item.busType || "Express"}
                {item.isAC ? " · AC" : ""}
              </Text>
            </View>
          ))}

        {!loading && !error && routes.length === 0 ? (
          <Text style={styles.empty}>
            No express routes in Firebase yet. Seed routes (npm run seed in backend) or mark routes as express in your
            catalog.
          </Text>
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
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800", flex: 1, textAlign: "center" },
  center: { paddingVertical: 24, alignItems: "center", gap: 8 },
  hint: { color: "#8EA3BA", fontSize: 13 },
  error: { color: "#FF8A8A", marginBottom: 12, fontWeight: "600" },
  empty: { color: "#8EA3BA", fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2E4E6E",
    backgroundColor: "#10253D",
    padding: 14,
    marginBottom: 10,
  },
  routeName: { color: "#EAF4FF", fontSize: 17, fontWeight: "800" },
  routeCode: { color: "#6EB4FF", fontSize: 13, fontWeight: "800", marginTop: 4 },
  meta: { color: "#A8C2DE", fontSize: 12, marginTop: 4 },
  durationPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3D6186",
    backgroundColor: "#18334F",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationIcon: { marginRight: 4 },
  durationText: { color: "#D5E9FD", fontSize: 11, fontWeight: "700" },
  operator: { color: "#7A9BB8", fontSize: 11, marginTop: 8, fontWeight: "600" },
});
