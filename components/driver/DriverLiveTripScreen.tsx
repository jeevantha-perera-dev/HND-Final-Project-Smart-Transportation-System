import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { PROVIDER_GOOGLE, type Region } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { getBookingsForTrip } from "../../services/api/booking";
import { publishDriverLocation } from "../../services/api/tracking";
import { DriverScheduledTrip, getTripWalkIns, type TripWalkInRow } from "../../services/api/trips";
import type { ManageSeatsFinishSummary } from "./DriverManualEntryScreen";

type DriverLiveTripScreenProps = {
  trip?: DriverScheduledTrip | null;
  queueRefreshToken?: number;
  manageSeatsSummary?: ManageSeatsFinishSummary | null;
  onBack?: () => void;
  onEndTrip?: () => void;
  onOpenScanner?: () => void;
  onOpenIncident?: () => void;
  onOpenQueueDetails?: (passenger: {
    id: string;
    name: string;
    type: "Adult" | "Student" | "Senior";
    tickets: string;
    seat?: string;
    boarded?: boolean;
  }) => void;
};

const DEFAULT_MAP_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function DriverLiveTripScreen({
  trip,
  queueRefreshToken = 0,
  manageSeatsSummary = null,
  onBack,
  onEndTrip,
  onOpenScanner,
  onOpenIncident,
  onOpenQueueDetails,
}: DriverLiveTripScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const statsRowInnerWidth = windowWidth - 14 * 2;
  const statsCardWidth = (statsRowInnerWidth - 10) / 2;
  const driverCoordsRef = useRef({
    latitude: DEFAULT_MAP_REGION.latitude,
    longitude: DEFAULT_MAP_REGION.longitude,
    speedKph: 0,
  });
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_MAP_REGION);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [speedKphDisplay, setSpeedKphDisplay] = useState<number | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [fullscreenMapSeed, setFullscreenMapSeed] = useState<Region>(DEFAULT_MAP_REGION);
  const [syncText, setSyncText] = useState("Sync location");
  const [queue, setQueue] = useState<
    {
      id: string;
      name: string;
      type: "Adult" | "Student" | "Senior";
      tickets: string;
      seat?: string;
      boarded: boolean;
      status: string;
      totalAmount: number;
    }[]
  >([]);
  const [walkIns, setWalkIns] = useState<TripWalkInRow[]>([]);
  const activeTripId = trip?.id ?? "";
  const activeVehicleCode = trip?.vehicleCode ?? "BUS-NA";
  const nextStopName = trip?.destinationStopName ?? "Next stop";

  useEffect(() => {
    if (!trip?.id) {
      setQueue([]);
      setWalkIns([]);
      return;
    }
    let mounted = true;
    const load = async () => {
      try {
        const [{ items }, walkInRes] = await Promise.all([
          getBookingsForTrip(trip.id),
          getTripWalkIns(trip.id),
        ]);
        if (!mounted) return;
        setQueue(
          items
            .filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")
            .map((b) => ({
              id: b.id,
              name: b.passengerLabel || b.userId,
              type: "Adult" as const,
              tickets: `${b.status} · ${b.seatId} · LKR ${b.totalAmount.toFixed(0)}`,
              seat: b.seatId?.trim() || undefined,
              boarded: Boolean(b.boarded),
              status: b.status,
              totalAmount: b.totalAmount,
            }))
        );
        setWalkIns(walkInRes.items);
      } catch {
        if (mounted) {
          setQueue([]);
          setWalkIns([]);
        }
      }
    };
    void load();
    const t = setInterval(() => void load(), 20000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [trip?.id, queueRefreshToken]);

  const routeTitle = useMemo(() => {
    if (trip?.routeName) return trip.routeName;
    return "Route 42A - Active";
  }, [trip?.routeName]);

  useEffect(() => {
    if (Platform.OS === "web") {
      setLocationStatus("denied");
      return;
    }
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== "granted") {
        setLocationStatus("denied");
        return;
      }
      setLocationStatus("granted");

      const applyPosition = (coords: Location.LocationObjectCoords) => {
        const { latitude, longitude, speed } = coords;
        driverCoordsRef.current = {
          latitude,
          longitude,
          speedKph:
            speed != null && speed >= 0
              ? Math.min(200, Math.round(speed * 3.6))
              : driverCoordsRef.current.speedKph,
        };
        setMapRegion((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
        if (speed != null && speed >= 0) {
          setSpeedKphDisplay(Math.min(200, Math.round(speed * 3.6)));
        }
      };

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        applyPosition(current.coords);
      } catch {
        /* keep default region */
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 15,
        },
        (loc) => {
          applyPosition(loc.coords);
        }
      );
    };

    void start();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  const pushLocation = useCallback(async () => {
    if (!activeTripId) {
      setSyncText("No trip id");
      return;
    }
    try {
      const { latitude, longitude, speedKph } = driverCoordsRef.current;
      await publishDriverLocation({
        tripId: activeTripId,
        vehicleId: activeVehicleCode,
        latitude,
        longitude,
        speedKph,
        nextStopName,
        etaMinutes: 4,
        seatsAvailable: trip?.seatsAvailable ?? 0,
      });
      setSyncText("Location synced");
    } catch {
      setSyncText("Sync failed");
    }
  }, [activeTripId, activeVehicleCode, nextStopName, trip?.seatsAvailable]);

  useEffect(() => {
    if (!activeTripId) return;
    const timer = setInterval(() => void pushLocation(), 12000);
    return () => clearInterval(timer);
  }, [pushLocation, activeTripId]);

  const seatsLeft = trip?.seatsAvailable ?? 0;
  const bookedCount = queue.length;
  const totalCapacity = Math.max(0, seatsLeft + bookedCount);
  const hasSeatSummary = manageSeatsSummary != null;
  const noShowLive = manageSeatsSummary?.noShowCount ?? 0;
  const walkInCountLive = walkIns.length;
  const walkInCashLkr = useMemo(
    () => walkIns.reduce((sum, w) => sum + (Number(w.fareLkr) || 0), 0),
    [walkIns]
  );
  const filledOccupancy = Math.max(0, bookedCount + walkInCountLive - noShowLive);
  const occupancyPct =
    totalCapacity > 0 ? Math.min(100, Math.round((filledOccupancy / totalCapacity) * 100)) : 0;
  const appEarningsLkr = useMemo(
    () =>
      queue.reduce(
        (sum, q) => (q.boarded && q.status === "CONFIRMED" ? sum + q.totalAmount : sum),
        0
      ),
    [queue]
  );
  const tripEarningsLkr = appEarningsLkr + walkInCashLkr;

  const openMapFullscreen = useCallback(() => {
    setFullscreenMapSeed({
      ...mapRegion,
      latitudeDelta: Math.max(mapRegion.latitudeDelta, 0.015),
      longitudeDelta: Math.max(mapRegion.longitudeDelta, 0.015),
    });
    setMapFullscreen(true);
  }, [mapRegion]);

  const closeMapFullscreen = useCallback(() => {
    setMapFullscreen(false);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { width: windowWidth }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color="#EAF2FB" />
          </Pressable>
          <Text style={styles.routeTitle}>{routeTitle}</Text>
          <Pressable onPress={onOpenIncident}>
            <Ionicons name="warning-outline" size={22} color="#E01C44" />
          </Pressable>
        </View>

        <Pressable
          style={styles.mapWrap}
          collapsable={false}
          onPress={Platform.OS === "web" ? openMapFullscreen : undefined}
          disabled={Platform.OS !== "web"}
        >
          {Platform.OS === "web" ? (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapWebNote}>Live map is available on the mobile app.</Text>
              <Text style={styles.mapExpandHint}>Tap for full screen</Text>
            </View>
          ) : (
            <MapView
              style={StyleSheet.absoluteFillObject}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={DEFAULT_MAP_REGION}
              region={mapRegion}
              showsUserLocation={locationStatus === "granted"}
              showsMyLocationButton={false}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              mapType="standard"
              onPress={openMapFullscreen}
            />
          )}

          {locationStatus === "denied" && Platform.OS !== "web" ? (
            <View style={styles.mapPermissionBanner} pointerEvents="box-none">
              <Text style={styles.mapPermissionText}>
                Turn on location access to see your position on the map.
              </Text>
            </View>
          ) : null}

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
            <Text style={styles.speedValue}>
              {speedKphDisplay != null ? String(speedKphDisplay) : "—"}
            </Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>

          {Platform.OS !== "web" ? (
            <View
              style={[
                styles.mapExpandBadge,
                locationStatus === "denied" ? styles.mapExpandBadgeAboveBanner : null,
              ]}
              pointerEvents="none"
            >
              <Ionicons name="expand-outline" size={14} color="#B8D4F0" />
              <Text style={styles.mapExpandBadgeText}>Full screen</Text>
            </View>
          ) : null}
        </Pressable>

        <Modal
          visible={mapFullscreen}
          animationType="fade"
          presentationStyle="fullScreen"
          statusBarTranslucent
          onRequestClose={closeMapFullscreen}
        >
          <View style={styles.fullscreenRoot}>
            {Platform.OS === "web" ? (
              <View style={styles.fullscreenWebBody}>
                <Text style={styles.mapWebNote}>Live map is available on the mobile app.</Text>
                <Pressable style={styles.fullscreenCloseBtnWide} onPress={closeMapFullscreen}>
                  <Text style={styles.fullscreenCloseBtnText}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <MapView
                  style={StyleSheet.absoluteFillObject}
                  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                  initialRegion={fullscreenMapSeed}
                  showsUserLocation={locationStatus === "granted"}
                  showsMyLocationButton={false}
                  scrollEnabled
                  zoomEnabled
                  rotateEnabled
                  pitchEnabled
                  toolbarEnabled={false}
                  mapType="standard"
                />
                <Pressable
                  style={[
                    styles.fullscreenCloseBtn,
                    { top: Math.max(insets.top, 12) + 6, right: 12 },
                  ]}
                  onPress={closeMapFullscreen}
                  accessibilityLabel="Close map"
                >
                  <Ionicons name="close" size={26} color="#0A111C" />
                </Pressable>
              </>
            )}
          </View>
        </Modal>

        <View style={styles.nextStopCard}>
          <View style={styles.nextStopTop}>
            <View style={styles.nextStopLeft}>
              <View style={styles.nextStopTagWrap}>
                <Ionicons name="location-outline" size={12} color="#5E9DDC" />
                <Text style={styles.nextStopTag}>NEXT STOP</Text>
              </View>
              <Text style={styles.nextStopName} numberOfLines={3}>
                {nextStopName}
              </Text>
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

        <View style={[styles.statsRow, { width: statsRowInnerWidth }]}>
          <View style={[styles.statCard, { width: statsCardWidth }]}>
            <View style={styles.statTop}>
              <Ionicons name="people-outline" size={16} color="#5AE189" />
              <Text style={styles.statTitle} numberOfLines={1}>
                Occupancy
              </Text>
            </View>
            <View style={styles.occupancyRow}>
              <Text style={[styles.statBig, styles.occupancyBig]}>
                {filledOccupancy} / {totalCapacity}
              </Text>
            </View>
            <Text style={styles.bookedSub} numberOfLines={3}>
              {bookedCount} booked (app)
              {walkInCountLive > 0 ? ` · ${walkInCountLive} walk-in` : ""}
              {hasSeatSummary && noShowLive > 0 ? ` · ${noShowLive} no-show (Manage Seats)` : ""}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${occupancyPct}%` }]} />
            </View>
          </View>

          <View style={[styles.statCard, { width: statsCardWidth }]}>
            <View style={styles.statTop}>
              <Ionicons name="cash-outline" size={16} color="#F4C44B" />
              <Text style={styles.statTitle} numberOfLines={2}>
                TRIP EARNINGS
              </Text>
            </View>
            <View style={styles.earningsValueWrap}>
              <Text style={[styles.statBig, styles.totalValue]} numberOfLines={1} adjustsFontSizeToFit>
                LKR {tripEarningsLkr.toFixed(0)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.queueHeader}>
          <View style={styles.queueTitleRow}>
            <Text style={styles.queueTitle}>Boarding Queue</Text>
            <View style={styles.queueCount}>
              <Text style={styles.queueCountText}>{queue.length}</Text>
            </View>
          </View>
          <Pressable onPress={pushLocation}>
            <Text style={styles.scanManual}>{syncText}</Text>
          </Pressable>
        </View>

        {queue.map((p) => (
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
            <Pressable
              style={styles.queueActions}
              onPress={() =>
                onOpenQueueDetails?.({
                  id: p.id,
                  name: p.name,
                  type: p.type as "Adult" | "Student" | "Senior",
                  tickets: p.tickets,
                  seat: p.seat,
                  boarded: p.boarded,
                })
              }
            >
              <Ionicons name="information-circle-outline" size={18} color="#A7BED3" />
              <Ionicons name="chevron-forward-outline" size={18} color="#A7BED3" />
            </Pressable>
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
  header: { height: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  routeTitle: { color: "#EAF2FB", fontSize: 20, fontWeight: "800" },
  mapWrap: { height: 230, borderRadius: 2, overflow: "hidden", backgroundColor: "#1B2531", marginBottom: 12 },
  mapExpandHint: { color: "#7D95AB", fontSize: 12, fontWeight: "600", marginTop: 8, textAlign: "center" },
  mapExpandBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(17, 27, 40, 0.88)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapExpandBadgeText: { color: "#B8D4F0", fontSize: 11, fontWeight: "700" },
  mapExpandBadgeAboveBanner: { bottom: 52 },
  fullscreenRoot: { flex: 1, backgroundColor: "#0A111C" },
  fullscreenCloseBtn: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EAF2FB",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 6,
  },
  fullscreenWebBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  fullscreenCloseBtnWide: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: "#1E2C3D",
  },
  fullscreenCloseBtnText: { color: "#EAF2FB", fontSize: 16, fontWeight: "700" },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#2A3440",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  mapWebNote: { color: "#9EB4CB", fontSize: 14, fontWeight: "600", textAlign: "center" },
  mapPermissionBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(17, 27, 40, 0.92)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapPermissionText: { color: "#D7E6F7", fontSize: 12, fontWeight: "600", textAlign: "center" },
  turnCard: { position: "absolute", top: 14, left: 14, backgroundColor: "#111B28", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  turnIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#1E2C3D", alignItems: "center", justifyContent: "center" },
  turnLabel: { color: "#7D95AB", fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  turnText: { color: "#EDF5FF", fontSize: 18, fontWeight: "700" },
  speedChip: { position: "absolute", right: 14, bottom: 14, width: 56, height: 56, borderRadius: 28, backgroundColor: "#1B2531", alignItems: "center", justifyContent: "center" },
  speedValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", lineHeight: 21 },
  speedUnit: { color: "#A1B6CC", fontSize: 10, fontWeight: "600" },
  nextStopCard: { backgroundColor: "#0B3C72", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#165A9F", marginBottom: 12 },
  nextStopTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  /** Reserves space for minBadge so long stop names wrap instead of pushing the badge off-screen. */
  nextStopLeft: { flex: 1, minWidth: 0, paddingRight: 4 },
  nextStopTagWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  nextStopTag: { color: "#5E9DDC", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  nextStopName: { color: "#F5FCFF", fontSize: 40, fontWeight: "800", lineHeight: 44, flexShrink: 1 },
  nextStopEta: { color: "#BCD6F0", fontSize: 13, marginTop: 2, fontWeight: "600", flexShrink: 1 },
  minBadge: {
    width: 56,
    minWidth: 56,
    flexShrink: 0,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#68AFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  minValue: { color: "#0D2D4B", fontSize: 28, fontWeight: "800", lineHeight: 30 },
  minText: { color: "#234C78", fontSize: 11, fontWeight: "700", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#1D548B", marginVertical: 10 },
  nextStopBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  onScheduleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  onScheduleText: { color: "#D9ECFF", fontSize: 14, fontWeight: "700" },
  avatarRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#0B3C72", marginLeft: -6 },
  avatarMore: { color: "#E7F3FF", fontSize: 12, fontWeight: "700", marginLeft: 6 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    alignItems: "stretch",
    alignSelf: "center",
  },
  statCard: {
    backgroundColor: "#1A232F",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#212D3A",
    padding: 12,
    overflow: "hidden",
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  statTitle: { color: "#B5C6D8", fontSize: 12, fontWeight: "700", flex: 1, minWidth: 0 },
  earningsValueWrap: {
    marginTop: 12,
    width: "100%",
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  occupancyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    alignSelf: "stretch",
  },
  statBig: { color: "#F5FBFF", fontSize: 35, fontWeight: "800" },
  occupancyBig: { textAlign: "center", alignSelf: "stretch" },
  bookedSub: {
    color: "#9EB4CB",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    flexShrink: 1,
  },
  totalValue: { textAlign: "center", maxWidth: "100%" },
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
