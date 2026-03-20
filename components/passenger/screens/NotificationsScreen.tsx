import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NotificationCard, SectionHeader } from "../ui";
import { colors, spacing } from "../theme";

const filters = ["All", "Delays", "Route Changes", "Security"] as const;
type Filter = (typeof filters)[number];

const notifications = [
  {
    key: "1",
    type: "Delays" as Filter,
    title: "Route 42 - Major Delay",
    body: "The Downtown Express is running 15 minutes late due to traffic at Main St intersection.",
    time: "2 MINS AGO",
    important: true,
    icon: "alert-circle-outline" as const,
  },
  {
    key: "2",
    type: "Route Changes" as Filter,
    title: "New Faster Route Available",
    body: "Based on your history, Route 10B could save you 8 minutes on your evening commute.",
    time: "45 MINS AGO",
    important: true,
    icon: "git-compare-outline" as const,
  },
  {
    key: "3",
    type: "Security" as Filter,
    title: "Incident Reported: Station C",
    body: "Security incident reported near Platform 4. Please follow staff instructions and use Entrance B.",
    time: "1 HOUR AGO",
    important: false,
    icon: "shield-checkmark-outline" as const,
  },
];

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    if (activeFilter === "All") return notifications;
    return notifications.filter((item) => item.type === activeFilter);
  }, [activeFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <Ionicons name="flash-outline" size={18} color="#AFC4DD" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filters.map((filter) => {
              const active = filter === activeFilter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    active && styles.filterChipActive,
                    pressed && styles.filterPressed,
                  ]}
                >
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                    {filter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <SectionHeader title="TODAY" actionText="Mark all as read" />
          {filtered.map((item) => (
            <NotificationCard
              key={item.key}
              title={item.title}
              body={item.body}
              time={item.time}
              icon={item.icon}
              type={item.important ? "important" : "default"}
            />
          ))}

          <SectionHeader title="EARLIER" />
          <NotificationCard
            title="Scheduled Maintenance"
            body="Elevator at Grand Central Terminal will be out of service from 10 PM tonight for 4 hours."
            time="3 HOURS AGO"
            icon="time-outline"
            type="default"
          />
          <NotificationCard
            title="Wallet Balance Refilled"
            body="Your auto-refill of $25.00 was successful. Current balance: $42.50."
            time="YESTERDAY"
            icon="information-circle-outline"
            type="default"
          />

          <View style={styles.endState}>
            <Ionicons name="notifications-outline" size={22} color="#8DA2BB" />
            <Text style={styles.endText}>You are all caught up for now.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: spacing.page, paddingBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "800" },
  filterRow: {
    gap: 10,
    paddingBottom: 14,
    paddingRight: 6,
  },
  filterChip: {
    minHeight: 56,
    minWidth: 102,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E2F45",
    backgroundColor: "#101B2A",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    borderColor: "#2E5E9A",
    backgroundColor: "#173A67",
  },
  filterLabel: {
    color: "#AFBFD3",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  filterLabelActive: {
    color: "#EAF4FF",
  },
  filterPressed: { opacity: 0.85 },
  endState: { alignItems: "center", marginTop: 8, marginBottom: 8 },
  endText: { marginTop: 8, color: "#8EA1B8", fontSize: 12, textAlign: "center" },
});
