import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CompletedTripCard, ScreenCard, SectionHeader, TabSwitcher, TripCard } from "../ui";
import { colors, spacing } from "../theme";
import { PassengerRootStackParamList, PassengerTabsParamList } from "../types";
import FilterModal, { TripFilters } from "../FilterModal";
import FilterChip from "../FilterChip";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = CompositeScreenProps<
  BottomTabScreenProps<PassengerTabsParamList, "Trips">,
  NativeStackScreenProps<PassengerRootStackParamList>
>;

const tabs = ["Upcoming", "Completed"] as const;
type TripsTab = (typeof tabs)[number];
const upcomingTrips = [
  {
    key: "up-1",
    route: "R-104",
    status: "Live Now" as const,
    from: "Central Station",
    to: "Greenwood Park",
    date: "Oct 24, 2023",
    time: "08:30 AM",
    seat: "Seat 12A",
    bus: "BUS-442",
    slot: "morning" as const,
    dayLabel: "Today" as const,
  },
  {
    key: "up-2",
    route: "R-202",
    status: "Upcoming" as const,
    from: "West Terminal",
    to: "Airport Link",
    date: "Oct 26, 2023",
    time: "02:15 PM",
    seat: "Seat 04B",
    bus: "BUS-118",
    slot: "afternoon" as const,
    dayLabel: "Tomorrow" as const,
  },
];

const completedTrips = [
  {
    key: "done-1",
    route: "R-304",
    from: "Central Station",
    to: "Greenwood Park",
    date: "Oct 22, 2023",
    time: "08:30 AM",
    seat: "12A",
    bus: "BUS-442",
    slot: "morning" as const,
    dayLabel: "Custom" as const,
  },
  {
    key: "done-2",
    route: "R-203",
    from: "West Terminal",
    to: "Airport Link",
    date: "Oct 20, 2023",
    time: "02:15 PM",
    seat: "04B",
    bus: "BUS-118",
    slot: "afternoon" as const,
    dayLabel: "Custom" as const,
  },
];

export default function TripsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<TripsTab>("Upcoming");
  const defaultFilters: TripFilters = {
    date: "All",
    busStatus: "All",
    route: "All",
    timeRange: "All",
  };
  const [modalVisible, setModalVisible] = useState(false);
  const [draftFilters, setDraftFilters] = useState<TripFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<TripFilters>(defaultFilters);

  const goToQr = () => {
    navigation.navigate("QRTicket");
  };

  const goToLiveTracking = () => {
    navigation.navigate("LiveTracking");
  };

  const getTimeLabel = (slot: "morning" | "afternoon") =>
    slot === "morning" ? "Morning" : "Afternoon";

  const filterLogic = (trip: {
    status?: "Live Now" | "Upcoming";
    route: string;
    slot: "morning" | "afternoon";
    dayLabel: "Today" | "Tomorrow" | "Custom";
    isCompleted: boolean;
  }) => {
    if (appliedFilters.date !== "All" && trip.dayLabel !== appliedFilters.date) {
      return false;
    }
    if (
      appliedFilters.busStatus !== "All" &&
      !(
        (appliedFilters.busStatus === "Completed" && trip.isCompleted) ||
        appliedFilters.busStatus === trip.status
      )
    ) {
      return false;
    }
    if (appliedFilters.route !== "All" && trip.route !== appliedFilters.route) {
      return false;
    }
    if (
      appliedFilters.timeRange !== "All" &&
      getTimeLabel(trip.slot) !== appliedFilters.timeRange
    ) {
      return false;
    }
    return true;
  };

  const filteredUpcomingTrips = upcomingTrips.filter((trip) =>
    filterLogic({ ...trip, isCompleted: false }),
  );

  const filteredCompletedTrips = completedTrips.filter((trip) =>
    filterLogic({ ...trip, isCompleted: true }),
  );

  const activeFilterChips = [
    appliedFilters.date !== "All" ? { key: "date", label: `Date: ${appliedFilters.date}` } : null,
    appliedFilters.busStatus !== "All" ? { key: "busStatus", label: `Status: ${appliedFilters.busStatus}` } : null,
    appliedFilters.route !== "All" ? { key: "route", label: `Route: ${appliedFilters.route}` } : null,
    appliedFilters.timeRange !== "All" ? { key: "timeRange", label: `Time: ${appliedFilters.timeRange}` } : null,
  ].filter(Boolean) as { key: keyof TripFilters; label: string }[];

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>My Trips</Text>
            <Ionicons name="funnel-outline" size={18} color="#BBD1EB" />
          </View>

          <TabSwitcher
            options={tabs}
            active={activeTab}
            onChange={(nextTab) => {
              setActiveTab(nextTab);
            }}
          />

          {activeFilterChips.length > 0 ? (
            <View style={styles.activeChipsRow}>
              {activeFilterChips.map((chip) => (
                <FilterChip
                  key={chip.key}
                  label={chip.label}
                  active
                  removable
                  onRemove={() =>
                    setAppliedFilters((prev) => ({ ...prev, [chip.key]: "All" }))
                  }
                />
              ))}
            </View>
          ) : null}

          {activeTab === "Upcoming" ? (
            <>
              <SectionHeader
                title="SCHEDULED JOURNEYS"
                actionText="Filter"
                onActionPress={() => {
                  setDraftFilters(appliedFilters);
                  setModalVisible(true);
                }}
              />
              {filteredUpcomingTrips.map((trip) => (
                <TripCard
                  key={trip.key}
                  route={trip.route}
                  status={trip.status}
                  from={trip.from}
                  to={trip.to}
                  date={trip.date}
                  time={trip.time}
                  seat={trip.seat}
                  bus={trip.bus}
                  onViewQr={goToQr}
                />
              ))}
              <ScreenCard>
                <Pressable style={({ pressed }) => [styles.liveTrackingRow, pressed && styles.pressed]} onPress={goToLiveTracking}>
                  <View style={styles.liveIcon}>
                    <Ionicons name="navigate-outline" size={15} color="#76B1FF" />
                  </View>
                  <View style={styles.liveTextWrap}>
                    <Text style={styles.liveTitle}>Live Tracking</Text>
                    <Text style={styles.liveBody}>
                      Active trip show &quot;Live Now&quot;. Tap the ticket to see real-time bus location and ETA.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#87B8F2" />
                </Pressable>
              </ScreenCard>
            </>
          ) : (
            <>
              <SectionHeader
                title="PAST JOURNEYS"
                actionText="Filter"
                onActionPress={() => {
                  setDraftFilters(appliedFilters);
                  setModalVisible(true);
                }}
              />
              {filteredCompletedTrips.map((trip) => (
                <CompletedTripCard
                  key={trip.key}
                  route={trip.route}
                  from={trip.from}
                  to={trip.to}
                  date={trip.date}
                  time={trip.time}
                  seat={trip.seat}
                  bus={trip.bus}
                  onRate={() => navigation.navigate("RateTrip")}
                />
              ))}
            </>
          )}
        </ScrollView>
      </LinearGradient>
      <FilterModal
        visible={modalVisible}
        draftFilters={draftFilters}
        onChange={setDraftFilters}
        onClose={() => setModalVisible(false)}
        onApply={() => {
          setAppliedFilters(draftFilters);
          setModalVisible(false);
        }}
        onReset={() => {
          setDraftFilters(defaultFilters);
          setAppliedFilters(defaultFilters);
          setModalVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: spacing.page, paddingBottom: 24 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "800" },
  liveTrackingRow: { flexDirection: "row", gap: 10 },
  liveIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#163C67",
    alignItems: "center",
    justifyContent: "center",
  },
  liveTextWrap: { flex: 1 },
  liveTitle: { color: "#EAF4FF", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  liveBody: { color: "#A6B8CF", fontSize: 12, lineHeight: 16 },
  activeChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  pressed: { opacity: 0.82 },
});
