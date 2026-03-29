import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";
import { searchBusRoutes } from "../../../services/locationService";
import { enrichBusResultsWithTrips } from "../../../services/tripMatch";
import { BusResult } from "../../../types/bus";
import { formatArrivingHeadline, formatJourneyDuration } from "../../../utils/eta";
import { passengerRouteDisplayId } from "../../../utils/busDisplay";

const ACCENT = "#5E5CE6";
const BG = "#000000";
/** Dark purple/navy — Live Updates pill (Figma) */
const LIVE_PILL_BG = "#1A1F36";
/** Light blue — Live Updates icon + label */
const LIVE_BLUE = "#6EB4FF";
const CARD = "#1A1C24";
const TEXT_MUTED = "#8E8E93";
const CHIP_UNSELECTED = "#252830";
const CHIP_BORDER = "#3A3D48";
const BUS_ID_BLUE = "#6EB4FF";
const PREDICTION_PURPLE = "#B4A9FF";

const SORT_FILTERS = ["Recommended", "Cheapest", "Earliest", "Express"] as const;

function formatTravelDateLine(dateKey: string | undefined): string | null {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "AvailableBuses">;

export default function AvailableBusesScreen({ navigation, route }: Props) {
  const [sortBy, setSortBy] = useState<(typeof SORT_FILTERS)[number]>("Recommended");
  const [items, setItems] = useState<BusResult[]>(route.params?.initialResults ?? []);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(route.params?.initialError ?? null);

  const travelDateKey = route.params?.travelDateKey;
  const travelDateLine = useMemo(() => formatTravelDateLine(travelDateKey), [travelDateKey]);
  const searchOpts = useMemo(() => ({ travelDateKey }), [travelDateKey]);

  const fetchLiveResults = async () => {
    if (!route.params?.fromPlace || !route.params?.toPlace) {
      setError("Could not fetch live data. Check your connection.");
      return;
    }
    setLoading(true);
    setRetrying(false);
    setError(null);
    try {
      const raw = await searchBusRoutes(route.params.fromPlace, route.params.toPlace, searchOpts);
      const data = await enrichBusResultsWithTrips(
        raw,
        route.params.fromPlace.displayName || route.params.fromPlace.name,
        route.params.toPlace.displayName || route.params.toPlace.name,
        travelDateKey
      );
      setItems(data);
    } catch (firstError) {
      console.warn("[bus-search] initial fetch failed", firstError);
      setRetrying(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const retriedRaw = await searchBusRoutes(route.params.fromPlace, route.params.toPlace, searchOpts);
        const retried = await enrichBusResultsWithTrips(
          retriedRaw,
          route.params.fromPlace.displayName || route.params.fromPlace.name,
          route.params.toPlace.displayName || route.params.toPlace.name,
          travelDateKey
        );
        setItems(retried);
      } catch (secondError) {
        console.warn("[bus-search] retry failed", secondError);
        setError("Could not fetch live data. Check your connection.");
      } finally {
        setRetrying(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        if (!route.params?.fromPlace || !route.params?.toPlace) {
          if (mounted) setError("Could not fetch live data. Check your connection.");
          return;
        }
        const resultRaw = await searchBusRoutes(route.params.fromPlace, route.params.toPlace, searchOpts);
        if (!mounted) return;
        const result = await enrichBusResultsWithTrips(
          resultRaw,
          route.params.fromPlace.displayName || route.params.fromPlace.name,
          route.params.toPlace.displayName || route.params.toPlace.name,
          travelDateKey
        );
        if (!mounted) return;
        setItems(result);
      } catch (err) {
        if (!mounted) return;
        console.warn("[bus-search] load failed", err);
        setError("Could not fetch live data. Check your connection.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [route.params?.fromPlace, route.params?.toPlace, travelDateKey, searchOpts]);

  const buses = useMemo(() => {
    const copy = [...items];
    if (sortBy === "Cheapest") copy.sort((a, b) => a.price - b.price);
    if (sortBy === "Earliest") copy.sort((a, b) => a.durationMinutes - b.durationMinutes);
    if (sortBy === "Express") return copy.filter((item) => item.isExpress);
    if (sortBy === "Recommended") {
      copy.sort((a, b) => {
        if (a.type === "Recommended" && b.type !== "Recommended") return -1;
        if (a.type !== "Recommended" && b.type === "Recommended") return 1;
        return a.durationMinutes - b.durationMinutes;
      });
    }
    return copy;
  }, [sortBy, items]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Available Buses</Text>
          <View style={{ flex: 1 }} />
          <Pressable hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="options-outline" size={22} color={ACCENT} />
          </Pressable>
        </View>

        <View style={styles.subHeader}>
          <View style={styles.showingLabelWrap}>
            <Text style={styles.showingLabel} numberOfLines={1}>
              SHOWING {buses.length} OPTIONS
            </Text>
            {travelDateLine ? (
              <Text style={styles.travelDateHint} numberOfLines={1}>
                {`For ${travelDateLine}`}
              </Text>
            ) : null}
          </View>
          <Pressable style={styles.livePill}>
            <Ionicons name="flash" size={13} color={LIVE_BLUE} />
            <Text style={styles.livePillText}>Live Updates</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {SORT_FILTERS.map((label) => {
            const active = sortBy === label;
            return (
              <Pressable
                key={label}
                onPress={() => setSortBy(label)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? <SkeletonState retrying={retrying} /> : null}
          {!loading && error ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={fetchLiveResults}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}
          {!loading && !error && buses.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No direct bus routes found between these stops.</Text>
              <Text style={styles.emptySub}>Try expanding your search area or check nearby stops.</Text>
              <Pressable style={styles.retryBtn} onPress={fetchLiveResults}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </Pressable>
            </View>
          ) : null}
          {!loading &&
            !error &&
            buses.map((bus) => (
            <BusCard
              key={bus.id}
              bus={bus}
              onSelect={() => {
                if (!bus.tripId) return;
                navigation.navigate("SeatSelection", {
                  tripId: bus.tripId,
                  busId: passengerRouteDisplayId(bus.routeNumber, bus.shortRouteNumber),
                  routeName: bus.routeName,
                  price: `LKR ${bus.price.toFixed(0)}`,
                });
              }}
            />
            ))}

          <View style={styles.footerHint}>
            <View style={styles.footerIconWrap}>
              <Ionicons name="bus-outline" size={18} color={TEXT_MUTED} />
            </View>
            <Text style={styles.footerHintText}>
              {`Don't see your route? Try adjusting your search filters for more results.`}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function BusCard({ bus, onSelect }: { bus: BusResult; onSelect: () => void }) {
  const bookable = Boolean(bus.tripId);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.busIdRowWrap}>
          <View style={styles.busIdRow}>
            <Text style={styles.busId} numberOfLines={1} ellipsizeMode="tail">
              {passengerRouteDisplayId(bus.routeNumber, bus.shortRouteNumber)}
            </Text>
            {bus.isExpress ? (
              <View style={styles.expressTag}>
                <Text style={styles.expressTagText}>Express</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.arrivalCol}>
          <View style={styles.arrivalRow}>
            <Ionicons name="time-outline" size={15} color={BUS_ID_BLUE} />
            <Text style={styles.arrivalMins} numberOfLines={1}>
              {formatArrivingHeadline(bus.arrivingInMinutes)}
            </Text>
            <Text style={styles.arrivingInline} numberOfLines={1}>
              {" "}
              ARRIVING
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.routeName} numberOfLines={2} ellipsizeMode="tail">
        {bus.routeName}
      </Text>

      <View style={styles.seatsRow}>
        <Ionicons name="bus-outline" size={18} color={TEXT_MUTED} />
        <View style={styles.seatsLeftCol}>
          <Text style={styles.seatsLabel}>SEATS LEFT</Text>
          <Text style={styles.seatsValue}>{bus.seatsAvailable} Available</Text>
        </View>
        <CrowdPill crowd={bus.crowdLevel} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.predictionRow}>
        <Ionicons name="trending-up-outline" size={16} color={TEXT_MUTED} />
        <Text style={styles.predictionText}>
          {`${formatJourneyDuration(bus.durationMinutes)} • ${bus.distanceKm.toFixed(1)} km • `}
          <Text style={styles.predictionHighlight}>{bus.departureLabel}</Text>
        </Text>
        <Ionicons name="information-circle-outline" size={16} color={TEXT_MUTED} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.priceLabel}>SINGLE TRIP</Text>
          <Text style={styles.priceValue}>{`LKR ${bus.fareLKR.toFixed(0)}`}</Text>
          {!bookable ? <Text style={styles.noService}>No scheduled service for this route</Text> : null}
        </View>
        <Pressable style={[styles.selectBtn, !bookable && styles.selectBtnDisabled]} onPress={onSelect} disabled={!bookable}>
          <Text style={styles.selectBtnText}>{bookable ? "Select" : "Unavailable"}</Text>
          {bookable ? <Ionicons name="chevron-forward" size={15} color="#FFFFFF" /> : null}
        </Pressable>
      </View>
    </View>
  );
}

function CrowdPill({ crowd }: { crowd: BusResult["crowdLevel"] }) {
  const cfg = {
    Low: { label: "Low Crowd", bg: "#1A3D2A", fg: "#34C759", dot: "#34C759" },
    Medium: { label: "Medium Crowd", bg: "#3D3010", fg: "#FF9F0A", dot: "#FF9F0A" },
    High: { label: "High Crowd", bg: "#3D1518", fg: "#FF453A", dot: "#FF453A" },
  }[crowd];

  return (
    <View style={[styles.crowdPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.crowdDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.crowdText, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

function SkeletonState({ retrying }: { retrying: boolean }) {
  return (
    <View style={styles.skeletonWrap}>
      <Text style={styles.skeletonTitle}>{retrying ? "Retrying..." : "Finding real buses near you..."}</Text>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonLineLg} />
          <View style={styles.skeletonLineMd} />
          <View style={styles.skeletonLineSm} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2E323D",
  },
  headerIcon: {   paddingHorizontal: 4, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginLeft: 4 },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  showingLabelWrap: { flex: 1, marginRight: 4, minWidth: 0 },
  showingLabel: {
    color: "#AEAEB2",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace",
    }),
  },
  travelDateHint: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: LIVE_PILL_BG,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  livePillText: { color: LIVE_BLUE, fontSize: 11, fontWeight: "600" },
  filterScroll: {flexGrow: 0,flexShrink: 0}, //prevents scroll view from expanding
  filterRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 14, alignItems: "center" , flexDirection: "row"},
  filterChip: {
    height:36,
    alignItems:"center",
    justifyContent:"center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: CHIP_UNSELECTED,
    borderWidth: 1,
    borderColor: CHIP_BORDER,
  },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterChipText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600",lineHeight:18 },
  filterChipTextActive: { color: "#FFFFFF" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  /** Takes remaining width so the arrival pill stays on-card and can shrink the route id. */
  busIdRowWrap: { flex: 1, minWidth: 0, marginRight: 4 },
  busIdRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 },
  busId: { flexGrow: 1, flexShrink: 1, minWidth: 0, color: BUS_ID_BLUE, fontSize: 22, fontWeight: "800" },
  expressTag: {
    flexShrink: 0,
    backgroundColor: "#2E2848",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3D3558",
  },
  expressTagText: { color: "#A995E8", fontSize: 11, fontWeight: "700" },
  arrivalCol: { flexShrink: 0, alignItems: "flex-end", justifyContent: "center" },
  arrivalRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    justifyContent: "flex-end",
    maxWidth: "100%",
  },
  arrivalMins: { color: BUS_ID_BLUE, fontSize: 15, fontWeight: "700" },
  arrivingInline: {
    color: BUS_ID_BLUE,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  routeName: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", flexShrink: 1 },
  seatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  seatsLeftCol: { flex: 1 },
  seatsLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  seatsValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginTop: 2 },
  crowdPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  crowdDot: { width: 6, height: 6, borderRadius: 3 },
  crowdText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#2E323D",
    marginVertical: 2,
  },
  predictionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 4,
    minWidth: 0,
  },
  predictionText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    color: PREDICTION_PURPLE,
    fontSize: 12,
    fontWeight: "500",
  },
  predictionHighlight: { color: PREDICTION_PURPLE, fontWeight: "700" },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  priceLabel: { color: TEXT_MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  priceValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginTop: 2 },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  selectBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  selectBtnDisabled: { opacity: 0.45, backgroundColor: "#3A3D48" },
  noService: { color: "#FF9F0A", fontSize: 11, fontWeight: "600", marginTop: 6 },
  footerHint: {
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 12,
    gap: 10,
  },
  footerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#38383A",
    alignItems: "center",
    justifyContent: "center",
  },
  footerHintText: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 320,
  },
  errorText: {
    color: "#FF9F9F",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  emptyWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2E323D",
    backgroundColor: "#171A22",
    padding: 16,
    marginBottom: 10,
  },
  emptyTitle: { color: "#E9EEF5", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  emptySub: { color: "#A2B2C5", fontSize: 12, lineHeight: 18, marginBottom: 12 },
  retryBtn: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: ACCENT,
  },
  retryBtnText: { color: "#FFF", fontWeight: "700", fontSize: 12 },
  skeletonWrap: { gap: 12, marginBottom: 12 },
  skeletonTitle: { color: "#D7E6F8", fontSize: 14, fontWeight: "700" },
  skeletonCard: {
    borderRadius: 14,
    backgroundColor: "#171A22",
    borderWidth: 1,
    borderColor: "#2C3340",
    padding: 14,
    gap: 10,
  },
  skeletonLineLg: { height: 18, width: "55%", backgroundColor: "#2B3240", borderRadius: 8 },
  skeletonLineMd: { height: 14, width: "80%", backgroundColor: "#2B3240", borderRadius: 8 },
  skeletonLineSm: { height: 14, width: "35%", backgroundColor: "#2B3240", borderRadius: 8 },
});
