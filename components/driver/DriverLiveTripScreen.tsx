import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DriverLiveTripScreenProps = {
  onEndTrip?: () => void;
  onOpenScanner?: () => void;
};

const QUEUE = [
  { id: "1", name: "Julian Richards", type: "Adult", tickets: "1 Ticket(s)" },
  { id: "2", name: "Maria Thompson", type: "Student", tickets: "2 Ticket(s)" },
  { id: "3", name: "Sarah Chen", type: "Adult", tickets: "1 Ticket(s)" },
];

export default function DriverLiveTripScreen({
  onEndTrip,
  onOpenScanner,
}: DriverLiveTripScreenProps) {
  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.routeTitle}>Route 42A - Acti</Text>
          <Ionicons name="warning-outline" size={22} color="#E01C44" />
        </View>

        <View style={styles.mapWrap}>
          <View style={styles.mapPlaceholder} />
          <View style={styles.routeLineA} />
          <View style={styles.routeLineB} />

          <View style={styles.turnCard}>
            <View style={styles.turnIconWrap}>
              <Ionicons name="navigate-outline" size={14} color="#62AFFF" />
            </View>
            <View>
              <Text style={styles.turnLabel}>NEXT TURN</Text>
              <Text style={styles.turnText}>250m - Left onto Oak St</Text>
            </View>
          </View>

          <View style={styles.speedChip}>
            <Text style={styles.speedValue}>55</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>
        </View>

        <View style={styles.nextStopCard}>
          <View style={styles.nextStopTop}>
            <View>
              <View style={styles.nextStopTagWrap}>
                <Ionicons name="location-outline" size={12} color="#5E9DDC" />
                <Text style={styles.nextStopTag}>NEXT STOP</Text>
              </View>
              <Text style={styles.nextStopName}>West End Plaza</Text>
              <Text style={styles.nextStopEta}>Estimated Arrival: 14:42 (4 mins)</Text>
            </View>
            <View style={styles.minBadge}>
              <Text style={styles.minValue}>4</Text>
              <Text style={styles.minText}>MIN</Text>
            </View>
          </View>

          <View style={styles.divider} />
          <View style={styles.nextStopBottom}>
            <View style={styles.onScheduleRow}>
              <Ionicons name="time-outline" size={14} color="#D7EBFF" />
              <Text style={styles.onScheduleText}>On Schedule</Text>
            </View>
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, { backgroundColor: "#8BAECC" }]} />
              <View style={[styles.avatar, { backgroundColor: "#CFA596" }]} />
              <View style={[styles.avatar, { backgroundColor: "#90B0CF" }]} />
              <Text style={styles.avatarMore}>+5</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Ionicons name="people-outline" size={16} color="#5AE189" />
              <Text style={styles.statTitle}>Occupancy</Text>
            </View>
            <View style={styles.occupancyRow}>
              <Text style={styles.statBig}>32 / 45</Text>
              <Text style={styles.optimal}>Optimal</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Ionicons name="scan-circle-outline" size={16} color="#F4C44B" />
              <Text style={styles.statTitle}>TODAY&apos;S TOTAL</Text>
            </View>
            <Text style={[styles.statBig, styles.totalValue]}>142</Text>
          </View>
        </View>

        <View style={styles.queueHeader}>
          <View style={styles.queueTitleRow}>
            <Text style={styles.queueTitle}>Boarding Queue</Text>
            <View style={styles.queueCount}>
              <Text style={styles.queueCountText}>3</Text>
            </View>
          </View>
          <Pressable>
            <Text style={styles.scanManual}>Scan Manual</Text>
          </Pressable>
        </View>

        {QUEUE.map((p) => (
          <View key={p.id} style={styles.queueCard}>
            <View style={styles.queueAvatar}>
              <Ionicons name="person" size={16} color="#E6EFFA" />
            </View>
            <View style={styles.queueInfo}>
              <Text style={styles.queueName}>{p.name}</Text>
              <View style={styles.queueMeta}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{p.type}</Text>
                </View>
                <Text style={styles.tickets}>• {p.tickets}</Text>
              </View>
            </View>
            <View style={styles.queueActions}>
              <Ionicons name="information-circle-outline" size={18} color="#A7BED3" />
              <Ionicons name="checkmark-circle-outline" size={18} color="#A7BED3" />
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomSheet}>
        <Text style={styles.bottomTitle}>Confirm Boarding</Text>
        <View style={styles.bottomRow}>
          <Pressable style={styles.scannerBtn} onPress={onOpenScanner}>
            <Ionicons name="scan-outline" size={16} color="#E2EDF8" />
            <Text style={styles.scannerText}>Scanner</Text>
          </Pressable>
          <Pressable style={styles.endBtn} onPress={onEndTrip}>
            <Ionicons name="flag-outline" size={16} color="#E01C44" />
            <Text style={styles.endText}>End Trip</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A111C" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, paddingBottom: 130 },
  header: { height: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeTitle: { color: "#EAF2FB", fontSize: 20, fontWeight: "800" },
  mapWrap: { height: 230, borderRadius: 2, overflow: "hidden", backgroundColor: "#646C76", marginBottom: 12 },
  mapPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: "#6B727C" },
  routeLineA: { position: "absolute", top: 70, left: 80, width: 170, height: 3, backgroundColor: "#F0CB4A", transform: [{ rotate: "10deg" }] },
  routeLineB: { position: "absolute", top: 130, left: 150, width: 90, height: 3, backgroundColor: "#F0CB4A", transform: [{ rotate: "-70deg" }] },
  turnCard: { position: "absolute", top: 14, left: 14, backgroundColor: "#111B28", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  turnIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#1E2C3D", alignItems: "center", justifyContent: "center" },
  turnLabel: { color: "#7D95AB", fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  turnText: { color: "#EDF5FF", fontSize: 18, fontWeight: "700" },
  speedChip: { position: "absolute", right: 14, bottom: 14, width: 56, height: 56, borderRadius: 28, backgroundColor: "#1B2531", alignItems: "center", justifyContent: "center" },
  speedValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", lineHeight: 21 },
  speedUnit: { color: "#A1B6CC", fontSize: 10, fontWeight: "600" },
  nextStopCard: { backgroundColor: "#0B3C72", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#165A9F", marginBottom: 12 },
  nextStopTop: { flexDirection: "row", justifyContent: "space-between" },
  nextStopTagWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  nextStopTag: { color: "#5E9DDC", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  nextStopName: { color: "#F5FCFF", fontSize: 40, fontWeight: "800", lineHeight: 44 },
  nextStopEta: { color: "#BCD6F0", fontSize: 13, marginTop: 2, fontWeight: "600" },
  minBadge: { width: 52, height: 60, borderRadius: 12, backgroundColor: "#68AFFF", alignItems: "center", justifyContent: "center" },
  minValue: { color: "#0D2D4B", fontSize: 30, fontWeight: "800", lineHeight: 32 },
  minText: { color: "#234C78", fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#1D548B", marginVertical: 10 },
  nextStopBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  onScheduleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  onScheduleText: { color: "#D9ECFF", fontSize: 14, fontWeight: "700" },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#0B3C72", marginLeft: -6 },
  avatarMore: { color: "#E7F3FF", fontSize: 12, fontWeight: "700", marginLeft: 6 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: "#1A232F", borderRadius: 12, borderWidth: 1, borderColor: "#212D3A", padding: 12 },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  statTitle: { color: "#B5C6D8", fontSize: 12, fontWeight: "700" },
  occupancyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  statBig: { color: "#F5FBFF", fontSize: 35, fontWeight: "800" },
  optimal: { color: "#E1ECF8", fontSize: 14, fontWeight: "700" },
  totalValue: { textAlign: "center", marginTop: 20 },
  progressTrack: { height: 7, borderRadius: 4, backgroundColor: "#2A3644", marginTop: 8 },
  progressFill: { width: "72%", height: "100%", borderRadius: 4, backgroundColor: "#67A9EA" },
  queueHeader: { marginTop: 2, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  queueTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  queueTitle: { color: "#E2EEF9", fontSize: 28, fontWeight: "800" },
  queueCount: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#2D3A49", alignItems: "center", justifyContent: "center" },
  queueCountText: { color: "#DFECFA", fontSize: 12, fontWeight: "700" },
  scanManual: { color: "#67A9EA", fontSize: 14, fontWeight: "700" },
  queueCard: { minHeight: 70, borderRadius: 10, backgroundColor: "#1A232F", borderWidth: 1, borderColor: "#212D3A", paddingHorizontal: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  queueAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#324456", alignItems: "center", justifyContent: "center", marginRight: 10 },
  queueInfo: { flex: 1 },
  queueName: { color: "#EDF5FC", fontSize: 14, fontWeight: "700" },
  queueMeta: { marginTop: 3, flexDirection: "row", alignItems: "center" },
  typeBadge: { borderRadius: 999, backgroundColor: "#22364D", paddingHorizontal: 7, paddingVertical: 2 },
  typeText: { color: "#7DB0DF", fontSize: 10, fontWeight: "700" },
  tickets: { color: "#9CB1C6", fontSize: 12, marginLeft: 6, fontWeight: "600" },
  queueActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  bottomSheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#111A25", borderTopWidth: 1, borderTopColor: "#253242", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  bottomTitle: { color: "#EAF2FB", fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 10 },
  bottomRow: { flexDirection: "row", gap: 10 },
  scannerBtn: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: "#314153", backgroundColor: "#101824", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  scannerText: { color: "#E2ECF6", fontSize: 16, fontWeight: "700" },
  endBtn: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: "#4D1F2B", backgroundColor: "#101824", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  endText: { color: "#E01C44", fontSize: 16, fontWeight: "700" },
});
