import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DriverDashboardScreen from "./DriverDashboardScreen";
import DriverPerformanceScreen from "./DriverPerformanceScreen";
import DriverLiveTripScreen from "./DriverLiveTripScreen";
import DriverTripScannerScreen from "./DriverTripScannerScreen";
import DriverManualEntryScreen from "./DriverManualEntryScreen";
import DriverReportIncidentScreen from "./DriverReportIncidentScreen";
import DriverRoutesListScreen, { DriverRouteSummary } from "./DriverRoutesListScreen";
import DriverRouteDetailsScreen from "./DriverRouteDetailsScreen";
import DriverTripHistoryScreen from "./DriverTripHistoryScreen";
import DriverQueueDetailsScreen, { DriverPassengerDetails } from "./DriverQueueDetailsScreen";
import DriverIncidentHistoryScreen from "./DriverIncidentHistoryScreen";
import DriverSettingsScreen from "./DriverSettingsScreen";

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
  | "incidentHistory";

type DriverHomeProps = {
  onLogout?: () => void;
};

export default function DriverHome({ onLogout }: DriverHomeProps) {
  const [activeTab, setActiveTab] = useState<DriverTab>("dashboard");
  const [overlay, setOverlay] = useState<DriverOverlay>(null);
  const [selectedRoute, setSelectedRoute] = useState<DriverRouteSummary | null>(null);
  const [selectedPassenger, setSelectedPassenger] = useState<DriverPassengerDetails | null>(null);
  const [queueBackTarget, setQueueBackTarget] = useState<"liveTrip" | "tripHistory">("liveTrip");

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
          onBack={() => setOverlay(queueBackTarget)}
        />
      );
    }

    if (overlay === "tripHistory") {
      return (
        <DriverTripHistoryScreen
          onBack={() => setOverlay(null)}
          onOpenQueueDetails={(passenger) => {
            setSelectedPassenger(passenger);
            setQueueBackTarget("tripHistory");
            setOverlay("queueDetails");
          }}
        />
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
          onBack={() => setOverlay("scanner")}
          onFinishCheck={() => setOverlay("scanner")}
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
          onOpenIncident={() => setOverlay("reportIncident")}
          onOpenScanner={() => setOverlay("scanner")}
          onOpenQueueDetails={(passenger) => {
            setSelectedPassenger(passenger);
            setQueueBackTarget("liveTrip");
            setOverlay("queueDetails");
          }}
          onEndTrip={() => {
            setOverlay(null);
          }}
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
        onStartTrip={() => setOverlay("liveTrip")}
        onViewRoutes={() => setOverlay("routesList")}
        onViewTripHistory={() => setOverlay("tripHistory")}
      />
    );
  }, [activeTab, onLogout, overlay, queueBackTarget, selectedPassenger, selectedRoute]);

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
