import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DriverRouteSummary } from "./DriverRoutesListScreen";

type DriverRouteDetailsScreenProps = {
  routeData?: DriverRouteSummary | null;
  onBack?: () => void;
  onStartTrip?: () => void;
};

type TimelineStop = { id: string; name: string; time: string; status: "Start" | "Stop" | "End" };

function buildTimeline(routeData?: DriverRouteSummary | null): TimelineStop[] {
  if (!routeData) {
    return [
      { id: "1", name: "Origin", time: "—", status: "Start" },
      { id: "2", name: "Destination", time: "—", status: "End" },
    ];
  }
  const names =
    routeData.stops && routeData.stops.length > 0
      ? routeData.stops
      : [routeData.origin ?? "Origin", routeData.destination ?? "Destination"];
  const dep = routeData.departureTime ?? routeData.departure;
  const arr = routeData.arrivalTime ?? routeData.eta;
  return names.map((name, index) => ({
    id: String(index),
    name,
    time: index === 0 ? dep : index === names.length - 1 ? arr : "Via",
    status: index === 0 ? "Start" : index === names.length - 1 ? "End" : "Stop",
  }));
}

export default function DriverRouteDetailsScreen({
  routeData,
  onBack,
  onStartTrip,
}: DriverRouteDetailsScreenProps) {
  const [showStops, setShowStops] = useState(true);
  const stops = useMemo(() => buildTimeline(routeData), [routeData]);
  const [checks, setChecks] = useState({
    fuel: true,
    brakes: true,
    tires: false,
    doors: true,
  });

  const toggle = (key: keyof typeof checks) =>
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const allReady = Object.values(checks).every(Boolean);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E2EDF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Route Details</Text>
      </View>
      <View style={styles.separator} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.routeCard}>
          <Text style={styles.routeId}>{routeData?.routeId ?? "—"}</Text>
          <Text style={styles.routeName}>{routeData?.name ?? "Route"}</Text>
          <View style={styles.metaRow}>
            <Meta icon="bus-outline" text={routeData?.vehicle ?? "—"} />
            <Meta icon="play-circle-outline" text={`Dep ${routeData?.departure ?? "—"}`} />
            <Meta icon="flag-outline" text={`ETA ${routeData?.eta ?? "—"}`} />
          </View>
        </View>

        <Pressable style={styles.sectionHeader} onPress={() => setShowStops((prev) => !prev)}>
          <Text style={styles.sectionTitle}>Stop Timeline</Text>
          <Ionicons name={showStops ? "chevron-up" : "chevron-down"} size={18} color="#9DB2C7" />
        </Pressable>
        {showStops ? (
          <View style={styles.stopsCard}>
            {stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.nodeCol}>
                  <View style={[styles.node, stop.status === "Start" && styles.nodeStart, stop.status === "End" && styles.nodeEnd]} />
                  {index < stops.length - 1 ? <View style={styles.nodeLine} /> : null}
                </View>
                <View style={styles.stopTextCol}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopTime}>{stop.time}</Text>
                </View>
                <Text style={styles.stopStatus}>{stop.status}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Pre-Trip Checklist</Text>
        <View style={styles.checkCard}>
          <CheckRow label="Fuel level above minimum" checked={checks.fuel} onPress={() => toggle("fuel")} />
          <CheckRow label="Brake system verified" checked={checks.brakes} onPress={() => toggle("brakes")} />
          <CheckRow label="Tire pressure checked" checked={checks.tires} onPress={() => toggle("tires")} />
          <CheckRow label="Doors and lights tested" checked={checks.doors} onPress={() => toggle("doors")} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.startBtn, !allReady && styles.startBtnDisabled]}
          disabled={!allReady}
          onPress={onStartTrip}
        >
          <Text style={[styles.startText, !allReady && styles.startTextDisabled]}>
            Start This Route
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color="#89AED3" />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

function CheckRow({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.checkRow} onPress={onPress}>
      <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
        {checked ? <Ionicons name="checkmark" size={12} color="#0C2E4F" /> : null}
      </View>
      <Text style={styles.checkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D" },
  header: { height: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1E2D3F" },
  content: { padding: 14, paddingBottom: 24 },
  routeCard: {
    borderRadius: 12,
    backgroundColor: "#0B3D73",
    borderWidth: 1,
    borderColor: "#165A9F",
    padding: 12,
    marginBottom: 12,
  },
  routeId: { color: "#9DC5EF", fontSize: 12, fontWeight: "700" },
  routeName: { color: "#F4FAFF", fontSize: 20, fontWeight: "800", marginTop: 2 },
  metaRow: { marginTop: 10, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#C1D8EE", fontSize: 12, fontWeight: "600" },
  sectionHeader: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: "#161F2A",
    borderWidth: 1,
    borderColor: "#273446",
    paddingHorizontal: 12,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: "#DBE6F2", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  stopsCard: {
    borderRadius: 12,
    backgroundColor: "#1A232F",
    borderWidth: 1,
    borderColor: "#273242",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  stopRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 52 },
  nodeCol: { width: 16, alignItems: "center" },
  node: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: "#7EA8D6" },
  nodeStart: { backgroundColor: "#5ECA89", borderColor: "#5ECA89" },
  nodeEnd: { backgroundColor: "#67A9EA", borderColor: "#67A9EA" },
  nodeLine: { width: 2, flex: 1, backgroundColor: "#3E5269", marginVertical: 2 },
  stopTextCol: { flex: 1, marginLeft: 10 },
  stopName: { color: "#EBF3FC", fontSize: 14, fontWeight: "700" },
  stopTime: { color: "#A8BDCF", fontSize: 12, marginTop: 2, fontWeight: "600" },
  stopStatus: { color: "#89AED3", fontSize: 11, fontWeight: "700", marginTop: 2 },
  checkCard: {
    borderRadius: 12,
    backgroundColor: "#171F2B",
    borderWidth: 1,
    borderColor: "#273344",
    padding: 12,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#406384",
    backgroundColor: "#111A25",
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxActive: { backgroundColor: "#67A9EA", borderColor: "#67A9EA" },
  checkText: { color: "#D0DEEC", fontSize: 13, fontWeight: "600" },
  footer: { borderTopWidth: 1, borderTopColor: "#1D2B3D", padding: 14, backgroundColor: "#0A121D" },
  startBtn: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#66AEF2",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnDisabled: { backgroundColor: "#58697E" },
  startText: { color: "#264A72", fontSize: 16, fontWeight: "800" },
  startTextDisabled: { color: "#90A3B7" },
});
