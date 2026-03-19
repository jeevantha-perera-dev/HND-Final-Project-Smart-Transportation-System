import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DriverPerformanceScreen() {
  const chartBars = [52, 63, 47, 74, 86, 69, 41];
  const chartDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sessions = [
    {
      id: "fri",
      day: "FRI",
      date: "12",
      title: "Friday Session",
      subtitle: "18 Trips . 8.2h Online",
      earning: "+$220.00",
      rateLabel: "Incentive $40",
      accent: "#49E18F",
    },
    {
      id: "thu",
      day: "THU",
      date: "11",
      title: "Thursday Session",
      subtitle: "16 Trips . 7.5h Online",
      earning: "+$195.00",
      rateLabel: "Standard Rate",
      accent: "#69AFFF",
    },
    {
      id: "wed",
      day: "WED",
      date: "10",
      title: "Wednesday Session",
      subtitle: "10 Trips . 6.0h Online",
      earning: "+$130.00",
      rateLabel: "Standard Rate",
      accent: "#69AFFF",
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.weeklyCard}>
        <View style={styles.weeklyHeader}>
          <Text style={styles.weeklyCaption}>This Week&apos;s Earnings</Text>
          <View style={styles.growthChip}>
            <Text style={styles.growthText}>+12.5%</Text>
          </View>
        </View>
        <Text style={styles.weeklyAmount}>$1,128.50</Text>
        <View style={styles.weeklyDivider} />
        <View style={styles.metricRow}>
          <View>
            <Text style={styles.metricLabel}>TRIPS COMPLETED</Text>
            <View style={styles.metricValueRow}>
              <Ionicons name="bus-outline" size={14} color="#28548A" />
              <Text style={styles.metricValue}>93</Text>
            </View>
          </View>
          <View>
            <Text style={styles.metricLabel}>AVG. RATING</Text>
            <View style={styles.metricValueRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#28548A" />
              <Text style={styles.metricValue}>4.92</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartTitle}>Earnings Trend</Text>
            <Text style={styles.chartSubtitle}>Daily income vs target</Text>
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
          <Text style={styles.kpiLabel}>HOURS ONLINE</Text>
          <Text style={styles.kpiValue}>38.5h</Text>
          <Text style={styles.kpiHint}>On Track</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#DCF6E8" }]}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2C8E59" />
          </View>
          <Text style={styles.kpiLabel}>ACCEPT RATE</Text>
          <Text style={styles.kpiValue}>98%</Text>
          <Text style={styles.kpiHint}>+2% vs LW</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Daily Activity</Text>

      <View style={styles.activityWrap}>
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

      <Pressable style={styles.historyButton}>
        <Text style={styles.historyButtonText}>View Monthly History</Text>
      </Pressable>
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
});
