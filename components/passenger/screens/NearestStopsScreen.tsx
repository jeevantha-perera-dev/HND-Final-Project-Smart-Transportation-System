import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadRouteOriginGroups, type RouteOriginGroup } from "../../../services/routeOriginGroups";
import { distanceBetweenLatLonMeters, getBusStopsNear } from "../../../services/locationService";
import type { BusStop } from "../../../types/bus";
import { PassengerHomeStackParamList } from "../types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "NearestStops">;

type StopRow = BusStop & { distanceM: number };

type LatLng = { latitude: number; longitude: number };

const DEFAULT_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const SEARCH_RADIUS_M = 1500;

/**
 * Reference coordinates for Sri Lanka — used when OSM has no data or location is off.
 * Distances are straight-line approximations for UI only.
 */
const FALLBACK_BUS_STOPS: BusStop[] = [
  {
    id: "ref-colombo-fort",
    name: "Colombo Fort — Pettah bus stand area",
    lat: 6.9356,
    lon: 79.8428,
    routes: ["138", "154", "176"],
  },
  {
    id: "ref-kollupitiya",
    name: "Kollupitiya — Galle Road",
    lat: 6.9149,
    lon: 79.8485,
    routes: ["138", "155"],
  },
  {
    id: "ref-bambalapitiya",
    name: "Bambalapitiya",
    lat: 6.8942,
    lon: 79.8551,
    routes: ["138", "176"],
  },
  {
    id: "ref-nugegoda",
    name: "Nugegoda junction",
    lat: 6.8648,
    lon: 79.8899,
    routes: ["138", "999"],
  },
  {
    id: "ref-rajagiriya",
    name: "Rajagiriya",
    lat: 6.9089,
    lon: 79.8964,
    routes: ["154"],
  },
  {
    id: "ref-dehiwala",
    name: "Dehiwala — Mount Lavinia line",
    lat: 6.8512,
    lon: 79.8655,
    routes: ["176"],
  },
];

function formatDistanceMeters(m: number): string {
  if (!Number.isFinite(m) || m < 0) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function stopsToRows(stops: BusStop[], lat: number, lon: number): StopRow[] {
  return stops
    .map((s) => ({
      ...s,
      distanceM: distanceBetweenLatLonMeters(lat, lon, s.lat, s.lon),
    }))
    .sort((a, b) => a.distanceM - b.distanceM);
}

export default function NearestStopsScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userPoint, setUserPoint] = useState<LatLng | null>(null);
  const [osmRows, setOsmRows] = useState<StopRow[]>([]);
  const [fallbackRows, setFallbackRows] = useState<StopRow[]>(() =>
    stopsToRows(FALLBACK_BUS_STOPS, DEFAULT_REGION.latitude, DEFAULT_REGION.longitude)
  );
  const [catalogRows, setCatalogRows] = useState<RouteOriginGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordsHint, setCoordsHint] = useState<string | null>(null);
  const [locGranted, setLocGranted] = useState(false);

  const mapProvider = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;

  const mapStops = useMemo(() => (osmRows.length > 0 ? osmRows : fallbackRows), [osmRows, fallbackRows]);
  const mapStopsAreFallback = osmRows.length === 0 && fallbackRows.length > 0;

  const fitMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady || Platform.OS === "web") return;

    const pts: LatLng[] = [];
    if (userPoint) pts.push(userPoint);
    for (const s of mapStops) {
      if (Number.isFinite(s.lat) && Number.isFinite(s.lon)) {
        pts.push({ latitude: s.lat, longitude: s.lon });
      }
    }

    if (pts.length >= 2) {
      map.fitToCoordinates(pts, {
        edgePadding: { top: 56, right: 36, bottom: 36, left: 36 },
        animated: true,
      });
    } else if (pts.length === 1) {
      map.animateToRegion(
        {
          ...pts[0]!,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        320
      );
    } else {
      map.animateToRegion(DEFAULT_REGION, 320);
    }
  }, [mapReady, mapStops, userPoint]);

  useEffect(() => {
    fitMap();
  }, [fitMap]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCoordsHint(null);

    const catalogPromise = loadRouteOriginGroups(40).catch(() => [] as RouteOriginGroup[]);

    let lat = DEFAULT_REGION.latitude;
    let lon = DEFAULT_REGION.longitude;
    let granted = false;

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      granted = permission.granted;
      setLocGranted(granted);

      if (granted) {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        setUserPoint({ latitude: lat, longitude: lon });
        setCoordsHint(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      } else {
        setUserPoint(null);
        setError(
          "Location is off — showing reference stops around Colombo. Turn on location for live OSM stops near you."
        );
      }
    } catch {
      setLocGranted(false);
      granted = false;
      setUserPoint(null);
      lat = DEFAULT_REGION.latitude;
      lon = DEFAULT_REGION.longitude;
      setError("Could not read GPS — showing reference stops. Check location settings and try refresh.");
    }

    let stops: BusStop[] = [];
    if (granted) {
      stops = await getBusStopsNear(lat, lon, SEARCH_RADIUS_M);
      if (stops.length === 0) {
        stops = await getBusStopsNear(lat, lon, 3500);
      }
    }

    const withDist = stops.map((s) => ({
      ...s,
      distanceM: distanceBetweenLatLonMeters(lat, lon, s.lat, s.lon),
    }));
    withDist.sort((a, b) => a.distanceM - b.distanceM);
    setOsmRows(withDist);

    setFallbackRows(stopsToRows(FALLBACK_BUS_STOPS, lat, lon).slice(0, 8));

    const groups = await catalogPromise;
    setCatalogRows(groups);

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <View style={styles.column}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Nearest stop</Text>
            <Pressable onPress={() => void load()} style={styles.iconBtn} hitSlop={10} disabled={loading}>
              <Ionicons name="refresh" size={20} color={colors.blueSoft} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Map shows OpenStreetMap stops, or reference pins if none are found. Lists include live data, reference
            stops, and your route catalog.
          </Text>

          {Platform.OS !== "web" ? (
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
                  <Marker coordinate={userPoint} title="You" description="Your current location">
                    <View style={styles.markerYou}>
                      <Ionicons name="person" size={16} color={colors.textPrimary} />
                    </View>
                  </Marker>
                ) : null}
                {mapStops.map((stop, index) => (
                  <Marker
                    key={stop.id}
                    coordinate={{ latitude: stop.lat, longitude: stop.lon }}
                    title={stop.name}
                    description={`${formatDistanceMeters(stop.distanceM)}${
                      mapStopsAreFallback ? " · reference" : index === 0 ? " · nearest" : ""
                    }`}
                    tracksViewChanges={false}
                  >
                    <View
                      style={[
                        styles.markerStop,
                        mapStopsAreFallback && styles.markerStopFallback,
                        !mapStopsAreFallback && index === 0 && styles.markerStopNearest,
                      ]}
                    >
                      <Ionicons
                        name="bus"
                        size={14}
                        color={
                          mapStopsAreFallback
                            ? colors.textSecondary
                            : index === 0
                              ? colors.textPrimary
                              : colors.bgBottom
                        }
                      />
                    </View>
                  </Marker>
                ))}
              </MapView>

              <View style={styles.mapOverlayTop}>
                <View style={styles.mapPill}>
                  <Ionicons name="map-outline" size={14} color={colors.blueSoft} />
                  <Text style={styles.mapPillText} numberOfLines={1}>
                    {mapStopsAreFallback
                      ? `${mapStops.length} reference pins`
                      : mapStops.length > 0
                        ? `${mapStops.length} OSM stops`
                        : "Map"}
                  </Text>
                </View>
                <Pressable
                  style={styles.locateBtn}
                  onPress={fitMap}
                  accessibilityLabel="Fit map to your location and stops"
                >
                  <Ionicons name="locate-outline" size={18} color={colors.textPrimary} />
                </Pressable>
              </View>

              {loading ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color={colors.blueSoft} size="large" />
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.mapWebPlaceholder}>
              <Ionicons name="map-outline" size={32} color={colors.textMuted} />
              <Text style={styles.mapWebText}>Interactive map is available on iOS and Android.</Text>
            </View>
          )}

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {coordsHint && locGranted ? (
              <View style={styles.locPill}>
                <Ionicons name="location" size={14} color={colors.blueSoft} />
                <Text style={styles.locPillText} numberOfLines={1}>
                  Your position · {coordsHint}
                </Text>
              </View>
            ) : null}

            {!loading && error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <Text style={styles.sectionLabel}>NEARBY BUS STOPS</Text>
            <Text style={styles.sectionHint}>
              {osmRows.length > 0
                ? "From OpenStreetMap, sorted by distance from you."
                : "No OSM stops in range — use reference list below."}
            </Text>

            {osmRows.map((stop, index) => (
              <View key={`osm-${stop.id}`} style={styles.stopCard}>
                <View style={styles.top}>
                  <Text style={styles.stopName} numberOfLines={2}>
                    {stop.name}
                  </Text>
                  <View style={styles.rightCol}>
                    {index === 0 ? <Text style={styles.badgeNearest}>Nearest</Text> : null}
                    <Text style={styles.distance}>{formatDistanceMeters(stop.distanceM)}</Text>
                  </View>
                </View>
                <View style={styles.badgeRow}>
                  <Text style={styles.sourceBadge}>OpenStreetMap</Text>
                </View>
                {stop.routes.length > 0 ? (
                  <Text style={styles.routes} numberOfLines={2}>
                    Routes: {stop.routes.join(", ")}
                  </Text>
                ) : (
                  <Text style={styles.routesMuted}>Route numbers not listed for this stop.</Text>
                )}
              </View>
            ))}

            <Text style={[styles.sectionLabel, styles.sectionSpacer]}>REFERENCE STOPS</Text>
            <Text style={styles.sectionHint}>
              Fixed Colombo-area coordinates for when map data or GPS is unavailable. Not live departures.
            </Text>

            {fallbackRows.map((stop, index) => (
              <View key={`fb-${stop.id}`} style={[styles.stopCard, styles.stopCardMuted]}>
                <View style={styles.top}>
                  <Text style={styles.stopName} numberOfLines={2}>
                    {stop.name}
                  </Text>
                  <View style={styles.rightCol}>
                    {osmRows.length === 0 && index === 0 ? <Text style={styles.badgeNearest}>Closest ref.</Text> : null}
                    <Text style={styles.distance}>{formatDistanceMeters(stop.distanceM)}</Text>
                  </View>
                </View>
                <View style={styles.badgeRow}>
                  <Text style={styles.sourceBadgeRef}>Demo / reference</Text>
                </View>
                <Text style={styles.routes} numberOfLines={2}>
                  Example routes: {stop.routes.join(", ")}
                </Text>
              </View>
            ))}

            {catalogRows.length > 0 ? (
              <>
                <Text style={[styles.sectionLabel, styles.sectionSpacer]}>ROUTE START POINTS</Text>
                <Text style={styles.sectionHint}>From your app route catalog (Firebase). Pair with search for paths.</Text>
                {catalogRows.map((row) => (
                  <View key={row.id} style={[styles.stopCard, styles.stopCardMuted]}>
                    <View style={styles.top}>
                      <Text style={styles.stopName} numberOfLines={2}>
                        {row.name}
                      </Text>
                      <View style={styles.rightCol}>
                        <Text style={styles.sourceBadgeCat}>Catalog</Text>
                      </View>
                    </View>
                    <Text style={styles.routes} numberOfLines={3}>
                      Routes: {row.routeIds}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  column: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", flex: 1, textAlign: "center" },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  mapWrap: {
    height: 280,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardSecondary,
  },
  mapOverlayTop: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  mapPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(16, 26, 41, 0.92)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPillText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700", flex: 1 },
  locateBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16, 26, 41, 0.92)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 9, 15, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  mapWebPlaceholder: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  mapWebText: { color: colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 18 },
  markerYou: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  markerStop: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.blueSoft,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  markerStopNearest: {
    backgroundColor: colors.successBlue,
    transform: [{ scale: 1.08 }],
  },
  markerStopFallback: {
    backgroundColor: colors.cardSecondary,
    borderColor: colors.textMuted,
  },
  listScroll: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  locPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 12,
    maxWidth: "100%",
  },
  locPillText: { color: colors.textSecondary, fontSize: 11, fontWeight: "600", flex: 1 },
  errorBanner: {
    color: "#FCA5A5",
    marginBottom: 12,
    fontWeight: "600",
    lineHeight: 20,
    backgroundColor: colors.cardSecondary,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionSpacer: { marginTop: 18 },
  sectionHint: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 10 },
  stopCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 14,
    marginBottom: 10,
  },
  stopCardMuted: { backgroundColor: colors.cardSecondary },
  top: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  stopName: { color: colors.textPrimary, fontSize: 16, fontWeight: "800", flex: 1, minWidth: 0 },
  rightCol: { alignItems: "flex-end", flexShrink: 0 },
  badgeNearest: {
    color: colors.blueSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  distance: { color: colors.blueSoft, fontSize: 15, fontWeight: "800" },
  badgeRow: { marginTop: 6 },
  sourceBadge: {
    alignSelf: "flex-start",
    color: colors.blueSoft,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sourceBadgeRef: {
    alignSelf: "flex-start",
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sourceBadgeCat: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  routes: { color: colors.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 17 },
  routesMuted: { color: colors.textMuted, fontSize: 12, marginTop: 8, fontStyle: "italic" },
});
