import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { DriverScheduledTrip, DriverTripStats } from "../../services/api/trips";

type DriverDashboardScreenProps = {
  onStartTrip?: () => void;
  onViewTripHistory?: () => void;
  onScheduleTrip?: () => void;
  driverName?: string;
  nextTrip?: DriverScheduledTrip | null;
  nextTripLoading?: boolean;
  tripStats?: DriverTripStats | null;
};

function formatClock(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function minsUntil(iso: string) {
  const m = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  return Math.max(0, m);
}

export default function DriverDashboardScreen({
  onStartTrip,
  onViewTripHistory,
  onScheduleTrip,
  driverName = "Driver",
  nextTrip = null,
  nextTripLoading = false,
  tripStats = null,
}: DriverDashboardScreenProps) {
  const greetingName = driverName.split(/\s+/)[0] || "Driver";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greetingWrap}>
        <Text style={styles.greeting}>{`Good Morning, ${greetingName}`}</Text>
        <View style={styles.statusRow}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#A8B8C9" />
          <Text style={styles.statusText}>Verified Driver</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.statusText}>Shift Active</Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton} onPress={onStartTrip}>
        <Ionicons name="play-outline" size={18} color="#0D2135" />
        <Text style={styles.primaryButtonText}>START SCHEDULED TRIP</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>UP NEXT</Text>
        <View style={styles.sectionActions}>
          <Pressable onPress={onScheduleTrip}>
            <Text style={styles.sectionLink}>Schedule a Trip</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.assignmentCard}>
        <View style={styles.assignmentHeader}>
          <Text style={styles.assignmentTag}>Next scheduled trip</Text>
          <View style={styles.assignmentMeta}>
            <Text style={styles.assignmentMetaLabel}>Departs in</Text>
            <Text style={styles.assignmentMetaValue}>
              {nextTripLoading ? "…" : nextTrip ? `${minsUntil(nextTrip.departureAt)} mins` : "—"}
            </Text>
          </View>
        </View>

        {nextTripLoading ? (
          <Text style={styles.routeTitle}>Loading your schedule…</Text>
        ) : nextTrip ? (
          <>
            <Text style={styles.routeTitle}>{nextTrip.routeName}</Text>

            <View style={styles.timelineWrap}>
              <View style={styles.timelineNodeWrap}>
                <View style={[styles.timelineNode, styles.timelineNodePrimary]} />
                <View style={styles.timelineLine} />
                <View style={styles.timelineNode} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.stopBlock}>
                  <Text style={styles.stopTitle}>{nextTrip.originStopName}</Text>
                  <Text style={styles.stopSubtitle}>{`Departure — ${formatClock(nextTrip.departureAt)}`}</Text>
                </View>
                <View style={styles.stopBlock}>
                  <Text style={styles.stopTitle}>{nextTrip.destinationStopName}</Text>
                  <Text style={styles.stopSubtitle}>{`Arrival — ${formatClock(nextTrip.arrivalAt)}`}</Text>
                </View>
              </View>
            </View>

            <View style={styles.routeMetaRow}>
              <View style={styles.routeMetaItem}>
                <View style={styles.metaIconWrap}>
                  <Ionicons name="bus-outline" size={14} color="#87B9FF" />
                </View>
                <View>
                  <Text style={styles.metaLabel}>Vehicle</Text>
                  <Text style={styles.metaValue}>{nextTrip.vehicleCode}</Text>
                </View>
              </View>
              <View style={styles.routeMetaItem}>
                <View style={styles.metaIconWrap}>
                  <Ionicons name="people-outline" size={14} color="#87B9FF" />
                </View>
                <View>
                  <Text style={styles.metaLabel}>Seats left</Text>
                  <Text style={styles.metaValue}>{String(nextTrip.seatsAvailable)}</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <Text style={styles.emptyNext}>
            No scheduled trips yet. Tap Schedule a Trip or seed trips for the network.
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>TODAY&apos;S SUMMARY</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "#46E68A" }]}>
            <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryValue}>
            {tripStats ? `LKR ${tripStats.earningsEstimateLKR.toFixed(0)}` : "LKR —"}
          </Text>
          <Text style={styles.summaryLabel}>Earnings (est.)</Text>
          <Text style={styles.summaryDelta}>From your trip history</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "#69AFFF" }]}>
            <Ionicons name="location-outline" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.summaryValue}>{tripStats ? String(tripStats.tripsLast7Days) : "—"}</Text>
          <Text style={styles.summaryLabel}>Trips</Text>
          <Text style={styles.summaryDelta}>Last 7 days</Text>
        </View>
      </View>

      <Pressable style={styles.historyBtn} onPress={onViewTripHistory}>
        <Ionicons name="time-outline" size={16} color="#8BC0F2" />
        <Text style={styles.historyBtnText}>View Trip History</Text>
        <Ionicons name="chevron-forward-outline" size={16} color="#8BC0F2" />
      </Pressable>

      <View style={styles.alertCard}>
        <View style={styles.alertIconWrap}>
          <Ionicons name="information-circle-outline" size={18} color="#D5DFEA" />
        </View>
        <View style={styles.alertTextWrap}>
          <Text style={styles.alertTitle}>Route Alert</Text>
          <Text style={styles.alertBody}>
            Heavy traffic reported on Main St. bypass. Consider taking the
            West-side arterial for Route 402.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#D5DFEA" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071523",
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  greetingWrap: {
    marginTop: 14,
    marginBottom: 18,
  },
  greeting: {
    color: "#F4F8FC",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  statusRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    color: "#A8B8C9",
    fontSize: 14,
    fontWeight: "600",
  },
  separator: {
    color: "#6E849A",
    marginHorizontal: 3,
    fontSize: 14,
  },
  primaryButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: "#67A9EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  primaryButtonText: {
    color: "#0D2135",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sectionTitle: {
    color: "#D7E1EC",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  sectionLink: {
    color: "#67A9EA",
    fontSize: 14,
    fontWeight: "700",
  },
  assignmentCard: {
    backgroundColor: "#0A3B72",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#14589E",
    marginBottom: 24,
  },
  assignmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  assignmentTag: {
    backgroundColor: "#195591",
    color: "#A9CDF6",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  assignmentMeta: {
    alignItems: "flex-end",
  },
  assignmentMetaLabel: {
    color: "#D4E6FA",
    fontSize: 12,
    fontWeight: "600",
  },
  assignmentMetaValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  routeTitle: {
    color: "#F5FBFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  emptyNext: {
    color: "#B8D1EA",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  timelineWrap: {
    flexDirection: "row",
    marginBottom: 14,
  },
  timelineNodeWrap: {
    width: 18,
    alignItems: "center",
    marginTop: 4,
    marginRight: 8,
  },
  timelineNode: {
    width: 11,
    height: 11,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: "#8CB6E8",
    backgroundColor: "#0A3B72",
  },
  timelineNodePrimary: {
    backgroundColor: "#7AB2FF",
    borderColor: "#7AB2FF",
  },
  timelineLine: {
    height: 34,
    width: 2,
    backgroundColor: "#7A9EC5",
  },
  timelineContent: {
    flex: 1,
    gap: 8,
  },
  stopBlock: {
    marginBottom: 3,
  },
  stopTitle: {
    color: "#E6F1FC",
    fontSize: 14,
    fontWeight: "700",
  },
  stopSubtitle: {
    color: "#B8D1EA",
    fontSize: 13,
    marginTop: 2,
  },
  routeMetaRow: {
    flexDirection: "row",
    backgroundColor: "#0A2F58",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#154670",
  },
  routeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0B3D6F",
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    color: "#B3CAE0",
    fontSize: 12,
    fontWeight: "600",
  },
  metaValue: {
    color: "#F4FBFF",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 19,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  historyBtn: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A3B4F",
    backgroundColor: "#171F2A",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  historyBtnText: {
    color: "#CFE4F8",
    fontSize: 14,
    fontWeight: "700",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#1A232F",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#212D3A",
  },
  summaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryValue: {
    color: "#F6FAFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  summaryLabel: {
    color: "#D2DEE9",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  summaryDelta: {
    color: "#8EA0B3",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "600",
  },
  alertCard: {
    backgroundColor: "#2C3642",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#354252",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  alertIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3B4654",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: "#EDF4FB",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertBody: {
    color: "#D2DFEA",
    fontSize: 14,
    lineHeight: 20,
  },
});
