import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DriverDashboardScreen from "./DriverDashboardScreen";
import DriverPerformanceScreen from "./DriverPerformanceScreen";
import DriverLiveTripScreen from "./DriverLiveTripScreen";
import DriverTripScannerScreen from "./DriverTripScannerScreen";
import DriverManualEntryScreen, { type ManageSeatsFinishSummary } from "./DriverManualEntryScreen";
import DriverReportIncidentScreen from "./DriverReportIncidentScreen";
import DriverRoutesListScreen, { DriverRouteSummary } from "./DriverRoutesListScreen";
import DriverRouteDetailsScreen from "./DriverRouteDetailsScreen";
import DriverTripHistoryScreen from "./DriverTripHistoryScreen";
import DriverQueueDetailsScreen, { DriverPassengerDetails } from "./DriverQueueDetailsScreen";
import DriverIncidentHistoryScreen from "./DriverIncidentHistoryScreen";
import DriverSettingsScreen from "./DriverSettingsScreen";
import DriverScheduleTripScreen from "./DriverScheduleTripScreen";
import DriverScheduledTripsScreen from "./DriverScheduledTripsScreen";
import { ApiError } from "../../services/api/client";
import { getSession } from "../../services/api/session";
import {
  completeTrip,
  getDriverTripStats,
  getMyScheduledTrips,
  type DriverScheduledTrip,
  type DriverTripStats,
} from "../../services/api/trips";

type DriverTab = "dashboard" | "performance" | "settings";
type DriverOverlay =
  | null
  | "liveTrip"
  | "scanner"
  | "manualEntry"
  | "reportIncident"
  | "routesList"
  | "routeDetails"
  | "tripHistory"
  | "queueDetails"
  | "incidentHistory"
  | "scheduleTrip"
  | "scheduledTrips";

type DriverHomeProps = {
  onLogout?: () => void;
};

export default function DriverHome({ onLogout }: DriverHomeProps) {
  const [activeTab, setActiveTab] = useState<DriverTab>("dashboard");
  const [overlay, setOverlay] = useState<DriverOverlay>(null);
  const [selectedRoute, setSelectedRoute] = useState<DriverRouteSummary | null>(null);
  const [activeTrip, setActiveTrip] = useState<DriverScheduledTrip | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<DriverPassengerDetails | null>(null);
  const [queueBackTarget, setQueueBackTarget] = useState<"liveTrip" | "tripHistory">("liveTrip");
  const [nextTrip, setNextTrip] = useState<DriverScheduledTrip | null>(null);
  const [nextTripLoading, setNextTripLoading] = useState(true);
  const [tripStats, setTripStats] = useState<DriverTripStats | null>(null);
  const [queueRefreshToken, setQueueRefreshToken] = useState(0);
  const [manageSeatsSummary, setManageSeatsSummary] = useState<ManageSeatsFinishSummary | null>(null);

  const refreshDriverSchedule = useCallback(async () => {
    setNextTripLoading(true);
    try {
      const [sched, stats] = await Promise.all([
        getMyScheduledTrips(),
        getDriverTripStats().catch(() => null),
      ]);
      setNextTrip(sched.items[0] ?? null);
      setTripStats(stats);
    } catch {
      setNextTrip(null);
      setTripStats(null);
    } finally {
      setNextTripLoading(false);
    }
  }, []);

  useEffect(() => {
    if (overlay !== null) return;
    void refreshDriverSchedule();
  }, [overlay, refreshDriverSchedule]);

  useEffect(() => {
    setManageSeatsSummary(null);
  }, [activeTrip?.id]);

  const handleEndTrip = useCallback(() => {
    const id = activeTrip?.id?.trim();
    if (!id) return;
    Alert.alert("End trip", "Mark this trip as completed and save trip earnings to your record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End trip",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              const result = await completeTrip(id);
              Alert.alert(
                "Trip completed",
                `Trip saved as completed. Recorded earnings: LKR ${result.tripEarningsLkr.toFixed(0)}.`
              );
              setActiveTrip(null);
              setOverlay(null);
              await refreshDriverSchedule();
            } catch (e) {
              Alert.alert(
                "Could not complete trip",
                e instanceof ApiError ? e.message : "Something went wrong. Try again."
              );
            }
          })();
        },
      },
    ]);
  }, [activeTrip?.id, refreshDriverSchedule]);

  const isOverlayOpen = overlay !== null;
  const headerTitle =
    activeTab === "performance"
      ? "My Performance"
      : activeTab === "settings"
        ? "Settings"
        : "Driver Dashboard";

  const activeScreen = useMemo(() => {
    if (overlay === "incidentHistory") {
      return (
        <DriverIncidentHistoryScreen
          onBack={() => setOverlay("liveTrip")}
        />
      );
    }

    if (overlay === "queueDetails") {
      return (
        <DriverQueueDetailsScreen
          passenger={selectedPassenger}
          tripId={queueBackTarget === "liveTrip" ? activeTrip?.id : null}
          onBack={() => setOverlay(queueBackTarget)}
          onBoardingChanged={() => setQueueRefreshToken((n) => n + 1)}
        />
      );
    }

    if (overlay === "tripHistory") {
      return (
        <DriverTripHistoryScreen onBack={() => setOverlay(null)} />
      );
    }

    if (overlay === "routeDetails") {
      return (
        <DriverRouteDetailsScreen
          routeData={selectedRoute}
          onBack={() => setOverlay("routesList")}
          onStartTrip={() => setOverlay("liveTrip")}
        />
      );
    }

    if (overlay === "scheduleTrip") {
      return (
        <DriverScheduleTripScreen
          onBack={() => setOverlay(null)}
          onScheduled={() => setOverlay("scheduledTrips")}
        />
      );
    }

    if (overlay === "scheduledTrips") {
      return (
        <DriverScheduledTripsScreen
          onBack={() => setOverlay(null)}
          onOpenSchedule={() => setOverlay("scheduleTrip")}
          onSelectTrip={(trip) => {
            setActiveTrip(trip);
            setOverlay("liveTrip");
          }}
        />
      );
    }

    if (overlay === "routesList") {
      return (
        <DriverRoutesListScreen
          onBack={() => setOverlay(null)}
          onOpenTripHistory={() => setOverlay("tripHistory")}
          onOpenRoute={(route) => {
            setSelectedRoute(route);
            setOverlay("routeDetails");
          }}
        />
      );
    }

    if (overlay === "reportIncident") {
      return (
        <DriverReportIncidentScreen
          onBack={() => setOverlay("liveTrip")}
          onSubmit={() => setOverlay("incidentHistory")}
        />
      );
    }

    if (overlay === "manualEntry") {
      return (
        <DriverManualEntryScreen
          tripId={activeTrip?.id}
          onBack={() => {
            setQueueRefreshToken((n) => n + 1);
            setOverlay("scanner");
          }}
          onFinishCheck={(summary) => {
            setManageSeatsSummary(summary);
            setOverlay("liveTrip");
            setQueueRefreshToken((n) => n + 1);
          }}
        />
      );
    }

    if (overlay === "scanner") {
      return (
        <DriverTripScannerScreen
          onBack={() => setOverlay("liveTrip")}
          onManualEntry={() => setOverlay("manualEntry")}
        />
      );
    }

    if (overlay === "liveTrip") {
      return (
        <DriverLiveTripScreen
          trip={activeTrip}
          queueRefreshToken={queueRefreshToken}
          manageSeatsSummary={manageSeatsSummary}
          onBack={() => setOverlay(null)}
          onOpenIncident={() => setOverlay("reportIncident")}
          onOpenScanner={() => setOverlay("scanner")}
          onOpenQueueDetails={(passenger) => {
            setSelectedPassenger(passenger);
            setQueueBackTarget("liveTrip");
            setOverlay("queueDetails");
          }}
          onEndTrip={handleEndTrip}
        />
      );
    }

    if (activeTab === "performance") {
      return <DriverPerformanceScreen />;
    }

    if (activeTab === "settings") {
      return <DriverSettingsScreen onLogout={onLogout} />;
    }

    return (
      <DriverDashboardScreen
        onStartTrip={() => setOverlay("scheduledTrips")}
        onViewTripHistory={() => setOverlay("tripHistory")}
        onScheduleTrip={() => setOverlay("scheduleTrip")}
        driverName={getSession().user?.fullName ?? "Driver"}
        nextTrip={nextTrip}
        nextTripLoading={nextTripLoading}
        tripStats={tripStats}
      />
    );
  }, [
    activeTab,
    activeTrip,
    handleEndTrip,
    manageSeatsSummary,
    nextTrip,
    nextTripLoading,
    onLogout,
    overlay,
    queueBackTarget,
    queueRefreshToken,
    selectedPassenger,
    selectedRoute,
    tripStats,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      {!isOverlayOpen && (
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Ionicons name="bus-outline" size={16} color="#E5F0FB" />
            </View>
            <Text style={styles.brandTitle}>{headerTitle}</Text>
          </View>
          <View style={styles.profileWrap}>
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.onlineDot} />
          </View>
        </View>
      )}

      {!isOverlayOpen && <View style={styles.divider} />}

      <View style={styles.body}>{activeScreen}</View>

      {!isOverlayOpen && (
        <View style={styles.tabBar}>
          <TabButton
            label="Dashboard"
            icon="grid-outline"
            active={activeTab === "dashboard"}
            onPress={() => setActiveTab("dashboard")}
          />
          <TabButton
            label="Performance"
            icon="trending-up-outline"
            active={activeTab === "performance"}
            onPress={() => setActiveTab("performance")}
          />
          <TabButton
            label="Settings"
            icon="settings-outline"
            active={activeTab === "settings"}
            onPress={() => setActiveTab("settings")}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, icon, active, onPress }: TabButtonProps) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Ionicons name={icon} size={20} color={active ? "#67A9EA" : "#94A6B8"} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071523",
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#122A41",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: "#F3F9FF",
    fontSize: 16,
    fontWeight: "800",
  },
  profileWrap: {
    width: 38,
    height: 38,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#233A52",
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#58D97F",
    position: "absolute",
    right: 0,
    bottom: 1,
    borderWidth: 2,
    borderColor: "#071523",
  },
  divider: {
    height: 1,
    backgroundColor: "#1D2B3B",
  },
  body: {
    flex: 1,
  },
  tabBar: {
    height: 66,
    backgroundColor: "#0A121E",
    borderTopWidth: 1,
    borderColor: "#1B2A3A",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    color: "#94A6B8",
    fontSize: 12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#67A9EA",
  },
});
