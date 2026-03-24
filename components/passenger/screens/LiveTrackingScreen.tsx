import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerRootStackParamList } from "../types";
import { getTripTracking } from "../../../services/api/trips";

const BG = "#121212";
const MAP_SURFACE = "#1A1C1E";
const BORDER = "#2C2C2E";
const TEXT = "#FFFFFF";
const SOS_RED = "#E53935";
const SKY = "#5EB3F6";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "LiveTracking">;

export default function LiveTrackingScreen({ navigation }: Props) {
  const [eta, setEta] = useState("4 mins");
  const [seats, setSeats] = useState("12 seats");
  const [nextStop, setNextStop] = useState("Old Town Junction");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const result = await getTripTracking("trip-demo-402");
        const latest = result.latest;
        if (!mounted || !latest) return;
        if (latest.etaMinutes) setEta(`${latest.etaMinutes} mins`);
        if (latest.seatsAvailable !== undefined) setSeats(`${latest.seatsAvailable} seats`);
        if (latest.nextStopName) setNextStop(String(latest.nextStopName));
      } catch {
        // keep UI fallback values when tracking endpoint has no data yet
      }
    };
    void load();
    const timer = setInterval(() => void load(), 12000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.headerSide}>
            <Ionicons name="chevron-back" size={24} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Live Tracking
          </Text>
          <Pressable
            hitSlop={12}
            style={styles.sosBtn}
            onPress={() => navigation.navigate("EmergencySOS")}
            accessibilityLabel="Emergency or SOS"
          >
            <View style={styles.sosShield}>
              <Text style={styles.sosBangText}>!</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.mapArea}>
          <View style={styles.mapOverlayTop}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>Bus 402 Live</Text>
            </View>
            <Pressable style={styles.layerBtn}>
              <Ionicons name="layers-outline" size={16} color="#D6EAFE" />
            </Pressable>
          </View>

          <View style={styles.routeLine} />
          <View style={styles.stopMarkerStart}>
            <Text style={styles.markerLabel}>You</Text>
          </View>
          <View style={styles.stopMarkerBus}>
            <Ionicons name="bus" size={14} color="#031322" />
          </View>
          <View style={styles.stopMarkerEnd}>
            <Text style={styles.markerLabel}>Stop C</Text>
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Route 402 - Downtown Express</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={SKY} />
              <Text style={styles.metaChipText}>ETA {eta}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="people-outline" size={13} color={SKY} />
              <Text style={styles.metaChipText}>{seats}</Text>
            </View>
          </View>
          <Text style={styles.sheetHint}>Next stop: {nextStop}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 48,
  },
  headerSide: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "left",
    marginHorizontal: 8,
  },
  sosBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sosShield: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: SOS_RED,
    alignItems: "center",
    justifyContent: "center",
  },
  sosBangText: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
    marginTop: -2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  mapArea: {
    flex: 1,
    backgroundColor: MAP_SURFACE,
  },
  mapOverlayTop: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  livePill: {
    height: 30,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#10253D",
    borderWidth: 1,
    borderColor: "#2F4D6D",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#34C759" },
  livePillText: { color: "#D5E9FD", fontSize: 12, fontWeight: "700" },
  layerBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#10253D",
    borderWidth: 1,
    borderColor: "#2F4D6D",
    alignItems: "center",
    justifyContent: "center",
  },
  routeLine: {
    position: "absolute",
    top: "30%",
    left: "16%",
    width: "68%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2B4A6A",
  },
  stopMarkerStart: {
    position: "absolute",
    top: "26%",
    left: "12%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#173A67",
    alignItems: "center",
    justifyContent: "center",
  },
  stopMarkerBus: {
    position: "absolute",
    top: "25%",
    left: "47%",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SKY,
    alignItems: "center",
    justifyContent: "center",
  },
  stopMarkerEnd: {
    position: "absolute",
    top: "26%",
    right: "12%",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#173A67",
    alignItems: "center",
    justifyContent: "center",
  },
  markerLabel: { color: "#EAF4FF", fontSize: 10, fontWeight: "700" },
  bottomSheet: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "#171A1F",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#3A3A3C",
    marginBottom: 10,
  },
  sheetTitle: { color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#111F31",
    borderWidth: 1,
    borderColor: "#24384E",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaChipText: { color: "#CFE4F9", fontSize: 12, fontWeight: "700" },
  sheetHint: { color: "#9DB1C7", fontSize: 12 },
});
