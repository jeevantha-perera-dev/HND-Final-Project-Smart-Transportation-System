import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError } from "../../services/api/client";
import {
  getDriverTripStats,
  getMyTripHistory,
  type DriverHistoryTrip,
} from "../../services/api/trips";

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfCurrentMonthExclusive(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function daysLookbackForCurrentMonth(): number {
  const spanMs = Date.now() - startOfCurrentMonth().getTime();
  return Math.min(366, Math.max(1, Math.ceil(spanMs / 86400000) + 2));
}

function isCompletedThisMonth(trip: DriverHistoryTrip): boolean {
  if (trip.status.toLowerCase() !== "completed" || !trip.completedAt) return false;
  const t = new Date(trip.completedAt).getTime();
  return t >= startOfCurrentMonth().getTime() && t < endOfCurrentMonthExclusive().getTime();
}

function formatCompletedShort(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-LK", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function currentMonthTitle(): string {
  return new Date().toLocaleString("en-LK", { month: "long", year: "numeric" });
}

export default function DriverPerformanceScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<{ totalTrips: number; tripsLast7Days: number; earningsEstimateLKR: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [monthlyRows, setMonthlyRows] = useState<DriverHistoryTrip[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const s = await getDriverTripStats();
        if (m) setStats(s);
      } catch {
        if (m) setStats(null);
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  const loadMonthlyTrips = useCallback(async () => {
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const { items } = await getMyTripHistory({ days: daysLookbackForCurrentMonth() });
      const rows = items.filter(isCompletedThisMonth).sort((a, b) => {
        const ta = new Date(a.completedAt ?? 0).getTime();
        const tb = new Date(b.completedAt ?? 0).getTime();
        return tb - ta;
      });
      setMonthlyRows(rows);
    } catch (e) {
      setMonthlyRows([]);
      setMonthlyError(e instanceof ApiError ? e.message : "Could not load trip history.");
    } finally {
      setMonthlyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!monthlyOpen) return;
    void loadMonthlyTrips();
  }, [monthlyOpen, loadMonthlyTrips]);

  const monthlyTotalLkr = useMemo(
    () => monthlyRows.reduce((sum, t) => sum + (Number(t.tripEarningsLkr) || 0), 0),
    [monthlyRows]
  );

  const chartDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartBars = useMemo(() => {
    const base = stats?.tripsLast7Days ?? 0;
    const seed = [0.6, 0.75, 0.5, 0.9, 1, 0.8, 0.45];
    return seed.map((f) => Math.max(12, Math.round(base * f * 8 + 20)));
  }, [stats?.tripsLast7Days]);

  const sessions = useMemo(() => {
    if (!stats) return [];
    return [
      {
        id: "wk",
        day: "7D",
        date: "•",
        title: "Last 7 days",
        subtitle: `${stats.tripsLast7Days} scheduled trips`,
        earning: `LKR ${stats.earningsEstimateLKR.toFixed(0)}`,
        rateLabel: "Estimated (wallet integration pending)",
        accent: "#49E18F",
      },
      {
        id: "all",
        day: "ALL",
        date: "•",
        title: "All time (as driver)",
        subtitle: `${stats.totalTrips} trips in Firestore`,
        earning: "LKR —",
        rateLabel: "Sri Lanka · LKR only",
        accent: "#69AFFF",
      },
    ];
  }, [stats]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyHeader}>
          <Text style={styles.weeklyCaption}>Driver summary (live)</Text>
          <View style={styles.growthChip}>
            <Text style={styles.growthText}>LKR</Text>
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#0B2A48" />
          </View>
        ) : (
          <Text style={styles.weeklyAmount}>
            {stats ? `LKR ${stats.earningsEstimateLKR.toFixed(0)}` : "LKR —"}
          </Text>
        )}
        <View style={styles.weeklyDivider} />
        <View style={styles.metricRow}>
          <View>
            <Text style={styles.metricLabel}>TRIPS (7 DAYS)</Text>
            <View style={styles.metricValueRow}>
              <Ionicons name="bus-outline" size={14} color="#28548A" />
              <Text style={styles.metricValue}>{stats?.tripsLast7Days ?? "—"}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.metricLabel}>TOTAL AS DRIVER</Text>
            <View style={styles.metricValueRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#28548A" />
              <Text style={styles.metricValue}>{stats?.totalTrips ?? "—"}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Earnings Trend</Text>
            <Text style={styles.chartSubtitle}>Relative activity (placeholder shape)</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterText}>Last 7 Days</Text>
          </View>
        </View>

        <View style={styles.chartArea}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, styles.gridMiddle]} />
          <View style={[styles.gridLine, styles.gridBottom]} />
          <View style={styles.barRow}>
            {chartBars.map((height, idx) => (
              <View key={chartDays[idx]} style={styles.barContainer}>
                <View style={[styles.bar, { height }]} />
                <Text style={styles.barDay}>{chartDays[idx]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#DCE7F8" }]}>
            <Ionicons name="time-outline" size={18} color="#4A66A5" />
          </View>
          <Text style={styles.kpiLabel}>LAST 7 DAYS</Text>
          <Text style={styles.kpiValue}>{stats?.tripsLast7Days ?? "—"}</Text>
          <Text style={styles.kpiHint}>Firestore trips</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#DCF6E8" }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2C8E59" />
          </View>
          <Text style={styles.kpiLabel}>ALL TRIPS</Text>
          <Text style={styles.kpiValue}>{stats?.totalTrips ?? "—"}</Text>
          <Text style={styles.kpiHint}>With your driver id</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Daily Activity</Text>

      <View style={styles.activityWrap}>
        {!sessions.length && !loading ? (
          <Text style={styles.emptyHint}>Sign in as a driver and schedule trips to see history here.</Text>
        ) : null}
        {sessions.map((session) => (
          <Pressable key={session.id} style={styles.activityCard}>
            <View style={[styles.activityAccent, { backgroundColor: session.accent }]} />
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>{session.day}</Text>
              <Text style={styles.dateNum}>{session.date}</Text>
            </View>

            <View style={styles.activityCenter}>
              <Text style={styles.activityTitle}>{session.title}</Text>
              <Text style={styles.activitySubtitle}>{session.subtitle}</Text>
            </View>

            <View style={styles.activityRight}>
              <Text style={styles.activityAmount}>{session.earning}</Text>
              <Text style={styles.activityRate}>{session.rateLabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9FB2C6" />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.historyButton} onPress={() => setMonthlyOpen(true)}>
        <Text style={styles.historyButtonText}>View Monthly History</Text>
      </Pressable>

      <Modal visible={monthlyOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setMonthlyOpen(false)}>
        <View style={[styles.modalScreen, { paddingTop: Math.max(insets.top, 12) }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleBlock}>
              <Text style={styles.modalTitle}>Trip earnings</Text>
              <Text style={styles.modalSubtitle}>{currentMonthTitle()} · each completed trip</Text>
            </View>
            <Pressable
              style={styles.modalClose}
              onPress={() => setMonthlyOpen(false)}
              hitSlop={12}
            >
              <Ionicons name="close" size={26} color="#D8E6F4" />
            </Pressable>
          </View>

          {monthlyLoading ? (
            <View style={styles.modalCenter}>
              <ActivityIndicator size="large" color="#67A9EA" />
              <Text style={styles.modalHint}>Loading your trips…</Text>
            </View>
          ) : monthlyError ? (
            <View style={styles.modalCenter}>
              <Text style={styles.modalError}>{monthlyError}</Text>
              <Pressable style={styles.modalRetry} onPress={() => void loadMonthlyTrips()}>
                <Text style={styles.modalRetryText}>Retry</Text>
              </Pressable>
            </View>
          ) : monthlyRows.length === 0 ? (
            <View style={styles.modalCenter}>
              <Ionicons name="receipt-outline" size={40} color="#5A6B7E" />
              <Text style={styles.modalEmptyTitle}>No completed trips this month</Text>
              <Text style={styles.modalEmptyBody}>
                When you end a trip from the live trip screen, it appears here with the LKR total for
                that run.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.modalList}
                contentContainerStyle={styles.modalListContent}
                showsVerticalScrollIndicator={false}
              >
                {monthlyRows.map((trip) => (
                  <View key={trip.id} style={styles.earnRow}>
                    <View style={styles.earnRowMain}>
                      <Text style={styles.earnRoute} numberOfLines={2}>
                        Route {trip.routeCode} · {trip.routeName}
                      </Text>
                      <Text style={styles.earnMeta} numberOfLines={1}>
                        {trip.vehicleCode}
                        {trip.originStopName && trip.destinationStopName
                          ? ` · ${trip.originStopName} → ${trip.destinationStopName}`
                          : ""}
                      </Text>
                      <Text style={styles.earnWhen}>{formatCompletedShort(trip.completedAt!)}</Text>
                    </View>
                    <Text style={styles.earnAmount}>LKR {trip.tripEarningsLkr.toFixed(0)}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <Text style={styles.modalFooterLabel}>Total this month ({monthlyRows.length} trips)</Text>
                <Text style={styles.modalFooterTotal}>LKR {monthlyTotalLkr.toFixed(0)}</Text>
              </View>
            </>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071523",
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  loadingRow: { paddingVertical: 16, alignItems: "center" },
  emptyHint: { color: "#9FB2C6", fontSize: 14, marginBottom: 8 },
  weeklyCard: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#67A9EA",
    padding: 14,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weeklyCaption: {
    color: "#2C5D90",
    fontSize: 14,
    fontWeight: "700",
  },
  growthChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  growthText: {
    color: "#E9F3FF",
    fontSize: 12,
    fontWeight: "700",
  },
  weeklyAmount: {
    color: "#0B2A48",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 6,
  },
  weeklyDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginTop: 10,
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metricLabel: {
    color: "#3E6490",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  metricValueRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricValue: {
    color: "#0B2A48",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  chartCard: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#151F2B",
    padding: 12,
    borderWidth: 1,
    borderColor: "#1F2D3C",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitle: {
    color: "#F1F6FC",
    fontSize: 22,
    fontWeight: "800",
  },
  chartSubtitle: {
    color: "#9FB2C6",
    fontSize: 14,
    marginTop: 2,
  },
  filterChip: {
    backgroundColor: "#2A3442",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterText: {
    color: "#D2DEEB",
    fontSize: 12,
    fontWeight: "700",
  },
  chartArea: {
    height: 166,
    marginTop: 14,
    position: "relative",
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 20,
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#223140",
    borderRadius: 1,
  },
  gridMiddle: {
    top: 58,
  },
  gridBottom: {
    top: 96,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  barContainer: {
    alignItems: "center",
  },
  bar: {
    width: 20,
    backgroundColor: "#67A9EA",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barDay: {
    marginTop: 6,
    color: "#ACBFD1",
    fontSize: 11,
    fontWeight: "600",
  },
  kpiRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#151F2B",
    borderWidth: 1,
    borderColor: "#1F2D3C",
    padding: 12,
  },
  kpiIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiLabel: {
    color: "#B0C1D2",
    fontSize: 11,
    fontWeight: "800",
  },
  kpiValue: {
    color: "#F2F8FF",
    fontSize: 35,
    fontWeight: "800",
    marginTop: 2,
    lineHeight: 40,
  },
  kpiHint: {
    color: "#A0B4C9",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 10,
    color: "#D6E1EB",
    fontSize: 30,
    fontWeight: "800",
  },
  activityWrap: {
    gap: 8,
  },
  activityCard: {
    backgroundColor: "#151F2B",
    borderWidth: 1,
    borderColor: "#1F2D3C",
    borderRadius: 10,
    minHeight: 72,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  activityAccent: {
    width: 3,
    borderRadius: 2,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  dateBadge: {
    width: 38,
    height: 46,
    borderRadius: 8,
    backgroundColor: "#2A3341",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dateDay: {
    color: "#B7C8D9",
    fontSize: 10,
    fontWeight: "700",
  },
  dateNum: {
    color: "#F1F7FF",
    fontSize: 14,
    fontWeight: "800",
  },
  activityCenter: {
    flex: 1,
  },
  activityTitle: {
    color: "#EDF4FB",
    fontSize: 16,
    fontWeight: "700",
  },
  activitySubtitle: {
    color: "#A7BACD",
    fontSize: 13,
    marginTop: 2,
  },
  activityRight: {
    marginRight: 8,
    alignItems: "flex-end",
  },
  activityAmount: {
    color: "#56DA90",
    fontSize: 16,
    fontWeight: "800",
  },
  activityRate: {
    color: "#B4C4D4",
    fontSize: 12,
    marginTop: 2,
  },
  historyButton: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#23405D",
    backgroundColor: "#0F1A27",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  historyButtonText: {
    color: "#7CB7EE",
    fontSize: 18,
    fontWeight: "700",
  },
  modalScreen: {
    flex: 1,
    backgroundColor: "#0A121D",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2D3F",
  },
  modalTitleBlock: { flex: 1, paddingRight: 8 },
  modalTitle: {
    color: "#EAF2FC",
    fontSize: 22,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: "#8FA9C4",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCenter: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  modalHint: { color: "#9AB0C6", fontSize: 14, fontWeight: "600" },
  modalError: { color: "#E88A8A", fontSize: 14, textAlign: "center", fontWeight: "600" },
  modalRetry: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1A3A5C",
    borderWidth: 1,
    borderColor: "#2C5D8E",
  },
  modalRetryText: { color: "#B8D9FF", fontWeight: "700" },
  modalEmptyTitle: {
    color: "#D8E6F4",
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  modalEmptyBody: {
    color: "#8FA9C4",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "600",
  },
  modalList: { flex: 1 },
  modalListContent: { padding: 16, paddingBottom: 8 },
  earnRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E2A38",
  },
  earnRowMain: { flex: 1, minWidth: 0 },
  earnRoute: {
    color: "#F1F8FF",
    fontSize: 15,
    fontWeight: "800",
  },
  earnMeta: {
    color: "#7A93AC",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  earnWhen: {
    color: "#9AB0C6",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  earnAmount: {
    color: "#56DA90",
    fontSize: 16,
    fontWeight: "800",
    flexShrink: 0,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#1E2D3F",
    backgroundColor: "#0D1622",
  },
  modalFooterLabel: {
    color: "#9AB0C6",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  modalFooterTotal: {
    color: "#67A9EA",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
});
