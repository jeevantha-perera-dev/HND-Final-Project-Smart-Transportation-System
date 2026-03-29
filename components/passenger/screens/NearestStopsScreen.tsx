import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadRouteOriginGroups, type RouteOriginGroup } from "../../../services/routeOriginGroups";
import { PassengerHomeStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "NearestStops">;

export default function NearestStopsScreen({ navigation }: Props) {
  const [groups, setGroups] = useState<RouteOriginGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadRouteOriginGroups(60);
      setGroups(data);
    } catch {
      setError("Could not load stops from your route catalog.");
      setGroups([]);
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
          <Text style={styles.title}>Nearest Stops</Text>
          <Pressable onPress={() => void load()} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color="#5EB3F6" />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>Origins from your Firebase route catalog (pair with search for exact paths).</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#5EB3F6" />
          </View>
        ) : null}

        {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading &&
          groups.map((stop) => (
            <View key={stop.id} style={styles.stopCard}>
              <View style={styles.top}>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.badge}>Origin</Text>
              </View>
              <Text style={styles.routes}>Routes: {stop.routeIds}</Text>
            </View>
          ))}

        {!loading && !error && groups.length === 0 ? (
          <Text style={styles.empty}>No route origins found. Seed routes into Firestore (backend npm run seed).</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  content: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800", flex: 1, textAlign: "center" },
  subtitle: { color: "#8EA3BA", fontSize: 12, marginBottom: 12, lineHeight: 17 },
  center: { paddingVertical: 20, alignItems: "center" },
  error: { color: "#FF8A8A", marginBottom: 12, fontWeight: "600" },
  empty: { color: "#8EA3BA", fontSize: 14, lineHeight: 20 },
  stopCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#223246",
    backgroundColor: "#101A27",
    padding: 14,
    marginBottom: 10,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stopName: { color: "#EAF4FF", fontSize: 16, fontWeight: "800", flex: 1, marginRight: 8 },
  badge: { color: "#5EB3F6", fontSize: 11, fontWeight: "800" },
  routes: { color: "#8EA3BA", fontSize: 12, marginTop: 5 },
});
