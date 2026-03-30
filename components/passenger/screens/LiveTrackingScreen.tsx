import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerRootStackParamList } from "../types";
import { getTripTracking } from "../../../services/api/trips";

const BG = "#121212";
const BORDER = "#2C2C2E";
const TEXT = "#FFFFFF";
const SOS_RED = "#E53935";
const SKY = "#5EB3F6";

/** Colombo — default when no GPS / no bus position yet */
const DEFAULT_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type Props = NativeStackScreenProps<PassengerRootStackParamList, "LiveTracking">;

type LatLng = { latitude: number; longitude: number };

export default function LiveTrackingScreen({ navigation, route }: Props) {
  const tripId = (route.params?.tripId ?? "").trim() || "trip-demo-402";
  const routeTitle = (route.params?.routeTitle ?? "").trim() || "Live trip";

  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userPoint, setUserPoint] = useState<LatLng | null>(null);
  const [busPoint, setBusPoint] = useState<LatLng | null>(null);
  const [locStatus, setLocStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [eta, setEta] = useState("—");
  const [seats, setSeats] = useState("—");
  const [nextStop, setNextStop] = useState("—");
  const [busSynced, setBusSynced] = useState(false);

  const fitMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const pts: LatLng[] = [];
    if (userPoint) pts.push(userPoint);
    if (busPoint) pts.push(busPoint);
    if (pts.length >= 2) {
      map.fitToCoordinates(pts, {
        edgePadding: { top: 110, right: 44, bottom: 200, left: 44 },
        animated: true,
      });
    } else if (pts.length === 1) {
      map.animateToRegion(
        {
          ...pts[0]!,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        },
        350
      );
    } else {
      map.animateToRegion(DEFAULT_REGION, 350);
    }
  }, [busPoint, mapReady, userPoint]);

  useEffect(() => {
    fitMap();
  }, [fitMap]);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocStatus("denied");
        return;
      }
      setLocStatus("granted");
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 12,
          timeInterval: 6000,
        },
        (loc) => {
          setUserPoint({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
    })();
    return () => {
      void sub?.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const result = await getTripTracking(tripId);
        const latest = result.latest;
        if (!mounted) return;
        if (
          latest &&
          typeof latest.latitude === "number" &&
          typeof latest.longitude === "number" &&
          Number.isFinite(latest.latitude) &&
          Number.isFinite(latest.longitude)
        ) {
          setBusPoint({ latitude: latest.latitude, longitude: latest.longitude });
          setBusSynced(true);
          if (latest.etaMinutes != null) setEta(`${latest.etaMinutes} min`);
          if (latest.seatsAvailable != null) setSeats(`${latest.seatsAvailable} seats`);
          if (latest.nextStopName) setNextStop(String(latest.nextStopName));
        } else {
          setBusPoint(null);
          setBusSynced(false);
        }
      } catch {
        if (mounted) {
          setBusPoint(null);
          setBusSynced(false);
        }
      }
    };
    void load();
    const timer = setInterval(() => void load(), 12000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [tripId]);

  const mapProvider = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.headerSide}>
            <Ionicons name="chevron-back" size={24} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Live Tracking
          </Text>
          <Pressable
            hitSlop={12}
            style={styles.sosBtn}
            onPress={() => navigation.navigate("EmergencySOS")}
            accessibilityLabel="Emergency or SOS"
          >
            <View style={styles.sosShield}>
              <Text style={styles.sosBangText}>!</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={mapProvider}
            initialRegion={DEFAULT_REGION}
            showsUserLocation={false}
            showsMyLocationButton={false}
            mapType="standard"
            onMapReady={() => setMapReady(true)}
          >
            {userPoint ? (
              <Marker coordinate={userPoint} title="You" description="Your location">
                <View style={styles.markerYou}>
                  <Ionicons name="person" size={16} color="#FFFFFF" />
                </View>
              </Marker>
            ) : null}
            {busPoint ? (
              <Marker coordinate={busPoint} title="Your bus" description="Live vehicle position">
                <View style={styles.markerBus}>
                  <Ionicons name="bus" size={18} color="#031322" />
                </View>
              </Marker>
            ) : null}
          </MapView>

          <View style={styles.mapOverlayTop}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText} numberOfLines={1}>
                {busSynced ? "Bus GPS live" : "Map · bus GPS when available"}
              </Text>
            </View>
            <Pressable style={styles.layerBtn} onPress={fitMap} accessibilityLabel="Recenter map">
              <Ionicons name="locate-outline" size={18} color="#D6EAFE" />
            </Pressable>
          </View>

          {locStatus === "denied" ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>Location off — enable it in settings to see yourself on the map.</Text>
            </View>
          ) : !busSynced && locStatus !== "pending" ? (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                No bus position yet. When the driver shares GPS, the bus appears here.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle} numberOfLines={2}>
            {routeTitle}
          </Text>
          <Text style={styles.sheetTripId} numberOfLines={1}>
            Trip · {tripId}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={13} color={SKY} />
              <Text style={styles.metaChipText}>ETA {eta}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="people-outline" size={13} color={SKY} />
              <Text style={styles.metaChipText}>{seats}</Text>
            </View>
          </View>
          <Text style={styles.sheetHint}>Next stop: {nextStop}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 48,
  },
  headerSide: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "left",
    marginHorizontal: 8,
  },
  sosBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sosShield: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: SOS_RED,
    alignItems: "center",
    justifyContent: "center",
  },
  sosBangText: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
    marginTop: -2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  mapWrap: { flex: 1, backgroundColor: "#1A1C1E" },
  mapOverlayTop: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  livePill: {
    flex: 1,
    marginRight: 8,
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: "#10253D",
    borderWidth: 1,
    borderColor: "#2F4D6D",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#34C759" },
  livePillText: { color: "#D5E9FD", fontSize: 12, fontWeight: "700", flex: 1 },
  layerBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#10253D",
    borderWidth: 1,
    borderColor: "#2F4D6D",
    alignItems: "center",
    justifyContent: "center",
  },
  markerYou: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2E7BD6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  markerBus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SKY,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "rgba(16,37,61,0.94)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#2F4D6D",
  },
  bannerText: { color: "#D5E9FD", fontSize: 12, lineHeight: 16, fontWeight: "600" },
  bottomSheet: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "#171A1F",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#3A3A3C",
    marginBottom: 10,
  },
  sheetTitle: { color: TEXT, fontSize: 16, fontWeight: "800", marginBottom: 4 },
  sheetTripId: { color: "#7A8FA6", fontSize: 11, fontWeight: "600", marginBottom: 10 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#111F31",
    borderWidth: 1,
    borderColor: "#24384E",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaChipText: { color: "#CFE4F9", fontSize: 12, fontWeight: "700" },
  sheetHint: { color: "#9DB1C7", fontSize: 12 },
});
