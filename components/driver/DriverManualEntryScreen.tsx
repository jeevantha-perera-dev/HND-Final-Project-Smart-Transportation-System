import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DriverManualEntryScreenProps = {
  onBack?: () => void;
  onFinishCheck?: () => void;
};

export default function DriverManualEntryScreen({
  onBack,
  onFinishCheck,
}: DriverManualEntryScreenProps) {
  const [walkInCount, setWalkInCount] = useState(3);
  const [noShowCount, setNoShowCount] = useState(0);

  const resetAll = () => {
    setWalkInCount(0);
    setNoShowCount(0);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#DEEAF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Manage Seats</Text>
        <Pressable style={styles.saveBtn}>
          <Ionicons name="save-outline" size={15} color="#61A9FF" />
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>

      <View style={styles.separator} />

      <View style={styles.occupancyCard}>
        <View style={styles.occupancyTop}>
          <View>
            <Text style={styles.occupancyTitle}>Live Occupancy</Text>
            <Text style={styles.vehicleText}>Vehicle: Bus-7729 (Route 42A)</Text>
          </View>
          <View style={styles.peopleChip}>
            <Ionicons name="people-outline" size={12} color="#6DB0FF" />
            <Text style={styles.peopleText}>25/40</Text>
          </View>
        </View>

        <View style={styles.ringWrap}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.ringValue}>63%</Text>
              <Text style={styles.ringLabel}>CAPACITY</Text>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>App Bookings</Text>
            <Text style={styles.metricValue}>22</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricTitle}>Remaining</Text>
            <Text style={[styles.metricValue, styles.remainingValue]}>15</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>MANUAL CORRECTIONS</Text>

      <View style={styles.adjustCard}>
        <View style={[styles.adjustIconWrap, styles.greenBg]}>
          <Ionicons name="person-add-outline" size={20} color="#27CE6E" />
        </View>
        <View style={styles.adjustInfo}>
          <Text style={styles.adjustTitle}>Walk-in Passengers</Text>
          <Text style={styles.adjustSubtitle}>Manual ticket sales</Text>
        </View>
        <View style={styles.counterWrap}>
          <Pressable
            style={styles.counterBtn}
            onPress={() => setWalkInCount((prev) => Math.max(0, prev - 1))}
          >
            <Ionicons name="person-remove-outline" size={16} color="#D84B4B" />
          </Pressable>
          <Text style={styles.counterValue}>{walkInCount}</Text>
          <Pressable
            style={styles.counterBtn}
            onPress={() => setWalkInCount((prev) => prev + 1)}
          >
            <Ionicons name="person-add-outline" size={16} color="#49D482" />
          </Pressable>
        </View>
      </View>

      <View style={styles.adjustCard}>
        <View style={[styles.adjustIconWrap, styles.redBg]}>
          <Ionicons name="alert-circle-outline" size={20} color="#EA3B3B" />
        </View>
        <View style={styles.adjustInfo}>
          <Text style={styles.adjustTitle}>App No-Shows</Text>
          <Text style={styles.adjustSubtitle}>Booked but not boarded</Text>
        </View>
        <View style={styles.counterWrap}>
          <Pressable
            style={styles.counterBtn}
            onPress={() => setNoShowCount((prev) => Math.max(0, prev - 1))}
          >
            <Ionicons name="person-remove-outline" size={16} color="#49D482" />
          </Pressable>
          <Text style={styles.counterValue}>{noShowCount}</Text>
          <Pressable
            style={styles.counterBtn}
            onPress={() => setNoShowCount((prev) => prev + 1)}
          >
            <Ionicons name="person-add-outline" size={16} color="#D84B4B" />
          </Pressable>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color="#89BFFF" />
        <Text style={styles.infoText}>
          Manual adjustments update the real-time capacity visible to passengers
          in the app. Ensure accuracy to prevent overbooking.
        </Text>
      </View>

      <View style={styles.bottomActions}>
        <Pressable style={styles.resetBtn} onPress={resetAll}>
          <Ionicons name="refresh-outline" size={16} color="#D8E7F7" />
          <Text style={styles.resetText}>Reset All</Text>
        </Pressable>
        <Pressable style={styles.finishBtn} onPress={onFinishCheck}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#25486E" />
          <Text style={styles.finishText}>Finish Check</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D", paddingHorizontal: 14, paddingTop: 8 },
  header: { height: 46, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 34, fontWeight: "800", marginLeft: 6, flex: 1 },
  saveBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  saveText: { color: "#61A9FF", fontSize: 15, fontWeight: "700" },
  separator: { height: 1, backgroundColor: "#1F2E3F", marginTop: 6, marginBottom: 10 },
  occupancyCard: { backgroundColor: "#0B2741", borderRadius: 14, borderWidth: 1, borderColor: "#163A5D", padding: 14 },
  occupancyTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  occupancyTitle: { color: "#E9F4FF", fontSize: 36, fontWeight: "800" },
  vehicleText: { color: "#5F9DDA", fontSize: 14, fontWeight: "600", marginTop: 3 },
  peopleChip: { borderRadius: 999, backgroundColor: "#142A43", borderWidth: 1, borderColor: "#1F3D5D", paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 },
  peopleText: { color: "#6DB0FF", fontSize: 12, fontWeight: "700" },
  ringWrap: { alignItems: "center", marginVertical: 12 },
  ringOuter: { width: 176, height: 176, borderRadius: 88, borderWidth: 16, borderColor: "#66AFFF", borderRightColor: "#2C3B4E", borderBottomColor: "#2C3B4E", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-35deg" }] },
  ringInner: { width: 128, height: 128, borderRadius: 64, backgroundColor: "#0B1E33", alignItems: "center", justifyContent: "center", transform: [{ rotate: "35deg" }] },
  ringValue: { color: "#F3F9FF", fontSize: 24, fontWeight: "800" },
  ringLabel: { color: "#E2EEF8", fontSize: 13, fontWeight: "800", marginTop: 2 },
  metricsRow: { flexDirection: "row", gap: 10 },
  metricCard: { flex: 1, backgroundColor: "#121A26", borderRadius: 10, borderWidth: 1, borderColor: "#1E2A3B", paddingVertical: 10, paddingHorizontal: 12 },
  metricTitle: { color: "#AFBED0", fontSize: 14, fontWeight: "700" },
  metricValue: { color: "#F1F7FF", fontSize: 32, fontWeight: "800", marginTop: 2 },
  remainingValue: { color: "#45D282" },
  sectionLabel: { color: "#D8E3EE", fontSize: 16, fontWeight: "800", letterSpacing: 0.4, marginTop: 14, marginBottom: 10 },
  adjustCard: { minHeight: 78, borderRadius: 12, backgroundColor: "#1A222E", borderWidth: 1, borderColor: "#273243", marginBottom: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" },
  adjustIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  greenBg: { backgroundColor: "rgba(33,170,91,0.22)" },
  redBg: { backgroundColor: "rgba(185,38,38,0.24)" },
  adjustInfo: { flex: 1, marginLeft: 10 },
  adjustTitle: { color: "#EEF4FC", fontSize: 16, fontWeight: "800" },
  adjustSubtitle: { color: "#A8B7C8", fontSize: 14, marginTop: 2, fontWeight: "600" },
  counterWrap: { width: 128, height: 42, borderRadius: 10, backgroundColor: "#151D28", borderWidth: 1, borderColor: "#273244", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
  counterBtn: { width: 34, height: 30, borderRadius: 8, backgroundColor: "#1E2735", alignItems: "center", justifyContent: "center" },
  counterValue: { color: "#F0F6FF", fontSize: 20, fontWeight: "800" },
  infoCard: { marginTop: 4, borderRadius: 12, borderWidth: 1, borderColor: "#18599A", backgroundColor: "#0C3C6D", paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", gap: 8 },
  infoText: { flex: 1, color: "#AFCDEB", fontSize: 13, lineHeight: 18, fontWeight: "600" },
  bottomActions: { marginTop: 12, flexDirection: "row", gap: 10 },
  resetBtn: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: "#2D3A4B", backgroundColor: "#141C28", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  resetText: { color: "#D8E7F7", fontSize: 16, fontWeight: "700" },
  finishBtn: { flex: 1, height: 48, borderRadius: 10, backgroundColor: "#65AEF3", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  finishText: { color: "#25486E", fontSize: 16, fontWeight: "800" },
});
