import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { NavigationProp } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PassengerHomeStackParamList, PassengerRootStackParamList } from "../types";
import { colors } from "../theme";
import { reverseGeocode } from "../../../services/api/places";
import LocationAutocomplete from "../../LocationAutocomplete";
import { useBusSearch } from "../../../hooks/useBusSearch";
import { listRoutes, type CatalogRoute } from "../../../services/api/routes";
import { Place } from "../../../types/bus";
import { passengerRouteCode } from "../../../utils/busDisplay";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "RouteSearch">;

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateDiffInDays(from: Date, to: Date) {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((toUtc - fromUtc) / (24 * 60 * 60 * 1000));
}

const MAX_SUGGESTED_ROUTES = 2;

function normStop(s: string) {
  return s.trim().toLowerCase();
}

function isColomboOrigin(origin: string): boolean {
  const o = normStop(origin);
  return o === "colombo" || o.startsWith("colombo ");
}

function destinationMatches(dest: string, city: string): boolean {
  const d = normStop(dest);
  const c = normStop(city);
  return d === c || d.startsWith(`${c},`) || d.startsWith(`${c} `);
}

function routePairKey(r: CatalogRoute) {
  return `${normStop(r.origin)}|${normStop(r.destination)}`;
}

/** Up to two rows: Colombo → Galle first when in catalog, then Colombo → Kandy, then any other route. */
function pickSuggestedRoutes(items: CatalogRoute[]): CatalogRoute[] {
  const valid = items.filter((r) => r.origin?.trim() && r.destination?.trim());
  if (valid.length === 0) return [];

  const used = new Set<string>();
  const out: CatalogRoute[] = [];

  const galle = valid.find((r) => isColomboOrigin(r.origin) && destinationMatches(r.destination, "Galle"));
  if (galle) {
    out.push(galle);
    used.add(routePairKey(galle));
  }

  const kandy = valid.find(
    (r) => isColomboOrigin(r.origin) && destinationMatches(r.destination, "Kandy") && !used.has(routePairKey(r))
  );
  if (kandy && out.length < MAX_SUGGESTED_ROUTES) {
    out.push(kandy);
    used.add(routePairKey(kandy));
  }

  for (const r of valid) {
    if (out.length >= MAX_SUGGESTED_ROUTES) break;
    const k = routePairKey(r);
    if (!used.has(k)) {
      out.push(r);
      used.add(k);
    }
  }

  return out;
}

function catalogRouteSubtitle(r: CatalogRoute): string {
  const parts: string[] = [];
  if (r.isExpress) parts.push("Express");
  if (r.distanceKm > 0) parts.push(`${r.distanceKm.toFixed(0)} km`);
  if (r.durationMinutes > 0) parts.push(`${Math.round(r.durationMinutes)} min`);
  const meta = parts.length ? parts.join(" · ") : "From your route catalog";
  return r.routeName?.trim() ? `${r.routeName.trim()} · ${meta}` : meta;
}

export default function RouteSearchScreen({ navigation, route }: Props) {
  const defaultFrom = "Central Terminal, Downtown";
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState("");
  const { fromPlace, setFromPlace, toPlace, setToPlace, search } = useBusSearch();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
  });
  const [selectedPref, setSelectedPref] = useState("AC");
  const [visibleDateCount, setVisibleDateCount] = useState(30);
  const [locatingOrigin, setLocatingOrigin] = useState(false);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [suggestedRoutes, setSuggestedRoutes] = useState<CatalogRoute[]>([]);
  const [suggestedLoading, setSuggestedLoading] = useState(true);
  const hasEditedFromRef = useRef(false);
  const fromValueRef = useRef(from);

  const navigateRoot = (
    screen: "CalendarPicker" | "RouteOptions",
    params?: PassengerRootStackParamList["CalendarPicker"]
  ) => {
    const root = navigation.getParent()?.getParent() as
      | NavigationProp<PassengerRootStackParamList>
      | undefined;
    if (screen === "CalendarPicker") {
      root?.navigate(screen, params);
      return;
    }
    root?.navigate(screen);
  };

  useEffect(() => {
    fromValueRef.current = from;
  }, [from]);

  useEffect(() => {
    const incomingDate = route.params?.selectedDate;
    if (incomingDate) {
      setSelectedDate(incomingDate);
    }
  }, [route.params?.selectedDate]);

  const startDateRef = useRef(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  const travelDates = Array.from({ length: visibleDateCount }, (_, offset) => {
    const date = startDateRef.current();
    date.setDate(date.getDate() + offset);
    const key = toDateKey(date);
    const top =
      offset === 0
        ? "TODAY"
        : offset === 1
          ? "TOMORROW"
          : date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

    return {
      key,
      top,
      day: String(date.getDate()),
      mon: date.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  useEffect(() => {
    const parsedSelected = parseDateKey(selectedDate);
    if (!parsedSelected) return;
    const startDate = startDateRef.current();
    const diff = dateDiffInDays(startDate, parsedSelected);
    if (diff >= visibleDateCount - 7) {
      setVisibleDateCount((count) => Math.max(count, diff + 30));
    }
  }, [selectedDate, visibleDateCount]);

  const selectedDateObj = parseDateKey(selectedDate);
  const pinnedTop = selectedDateObj
    ? selectedDateObj.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
    : "DATE";
  const pinnedDay = selectedDateObj ? String(selectedDateObj.getDate()) : "--";
  const pinnedMon = selectedDateObj ? selectedDateObj.toLocaleDateString("en-US", { month: "short" }) : "---";

  function toShortAddress(formattedAddress: string) {
    const parts = formattedAddress
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length <= 2) return formattedAddress;

    const country = parts[parts.length - 1];
    const adminPattern = /\b(district|province|state|county|region)\b/i;
    const postalPattern = /^\d{3,}$/;

    let locality = "";
    for (let i = parts.length - 2; i >= 0; i -= 1) {
      const part = parts[i];
      if (postalPattern.test(part)) continue;
      if (adminPattern.test(part)) continue;
      locality = part;
      break;
    }

    if (!locality) return `${parts[0]}, ${country}`;
    return `${locality}, ${country}`;
  }

  async function handleUseCurrentLocation() {
    const currentFrom = fromValueRef.current;
    const canAutofill =
      !hasEditedFromRef.current && (currentFrom.trim().length === 0 || currentFrom === defaultFrom);

    try {
      setLocatingOrigin(true);
      setLocationNote(null);

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationNote("Location permission denied. You can type your pickup location manually.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Always provide at least coordinates after GPS succeeds (so search has real lat/lon).
      if (canAutofill) {
        const coordLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setFrom(coordLabel);
        setFromPlace({
          id: `gps-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
          name: "Current location",
          displayName: coordLabel,
          lat: latitude,
          lon: longitude,
        });
      }

      try {
        const localResult = await Location.reverseGeocodeAsync({ latitude, longitude });
        const firstLocal = localResult[0];
        const localShort = firstLocal
          ? `${firstLocal.city || firstLocal.district || firstLocal.subregion || firstLocal.region || ""}${
              firstLocal.country ? `, ${firstLocal.country}` : ""
            }`.trim()
          : "";

        if (localShort && canAutofill && !localShort.startsWith(",")) {
          setFrom(localShort);
          setFromPlace({
            id: `gps-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
            name: localShort.split(",")[0]?.trim() || localShort,
            displayName: localShort,
            lat: latitude,
            lon: longitude,
          });
          return;
        }

        const response = await reverseGeocode(latitude, longitude);
        const formattedAddress = response.results?.[0]?.formatted_address?.trim();
        if (formattedAddress && canAutofill) {
          const short = toShortAddress(formattedAddress);
          setFrom(short);
          setFromPlace({
            id: `gps-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
            name: short.split(",")[0]?.trim() || short,
            displayName: formattedAddress,
            lat: latitude,
            lon: longitude,
          });
        } else if (!formattedAddress) {
          setLocationNote("Using coordinates. Could not resolve street address.");
        }
      } catch {
        setLocationNote("Using coordinates. Could not resolve street address.");
      }
    } catch {
      setLocationNote("Could not fetch current location right now. Please enter it manually.");
    } finally {
      setLocatingOrigin(false);
    }
  }

  useEffect(() => {
    void handleUseCurrentLocation();
    // Intentionally run once on mount; handler closes over latest state for that single run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setSuggestedLoading(true);
      try {
        const { items } = await listRoutes({ limit: 150 });
        if (!alive) return;
        setSuggestedRoutes(pickSuggestedRoutes(items));
      } catch {
        if (alive) setSuggestedRoutes([]);
      } finally {
        if (alive) setSuggestedLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const applySuggestedRoute = (route: CatalogRoute) => {
    const o = route.origin.trim();
    const d = route.destination.trim();
    if (!o || !d) return;
    hasEditedFromRef.current = true;
    setFrom(o);
    setTo(d);
    setFromPlace({
      id: `catalog-${route.id}-from`,
      name: o,
      displayName: o,
      lat: 0,
      lon: 0,
    });
    setToPlace({
      id: `catalog-${route.id}-to`,
      name: d,
      displayName: d,
      lat: 0,
      lon: 0,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#D6E7F7" />
              </Pressable>
              <Text style={styles.title}>Find a Bus</Text>
              <View style={styles.headerPlaceholder} />
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.sectionHeading}>Where to?</Text>
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark" size={11} color="#93E9A3" />
                <Text style={styles.verifiedPillText}>Verified Routes</Text>
              </View>
            </View>

            <View style={styles.inputStack}>
              <LocationAutocomplete
                value={from}
                onChange={(value) => {
                  hasEditedFromRef.current = true;
                  setFrom(value);
                  setFromPlace(null);
                }}
                onSelect={(place) => {
                  setFromPlace(place);
                  hasEditedFromRef.current = true;
                }}
                placeholder="From"
                iconType="origin"
              />
              {locatingOrigin ? <Text style={styles.locationNote}>Detecting your current location...</Text> : null}
              {!locatingOrigin && locationNote ? <Text style={styles.locationNote}>{locationNote}</Text> : null}
              <View style={styles.swapBetweenRow}>
                <Pressable
                  style={styles.swapBtn}
                  onPress={() => {
                    const currentFrom = from;
                    const currentOrigin = fromPlace;
                    setFrom(to);
                    setFromPlace(toPlace);
                    setTo(currentFrom);
                    setToPlace(currentOrigin);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Swap from and destination"
                >
                  <Ionicons name="swap-vertical-outline" size={14} color="#5EA1E6" />
                </Pressable>
              </View>
              <LocationAutocomplete
                value={to}
                onChange={(value) => {
                  setTo(value);
                  setToPlace(null);
                }}
                onSelect={(place) => setToPlace(place)}
                placeholder="Enter destination"
                iconType="destination"
              />
            </View>

            <View style={styles.blockHeader}>
              <View style={styles.rowCenter}>
                <Ionicons name="calendar-outline" size={14} color="#A7BCD1" />
                <Text style={styles.blockTitle}>Travel Date</Text>
              </View>
              <Pressable onPress={() => navigateRoot("CalendarPicker", { selectedDate })}>
                <Text style={styles.calendarText}>View Calendar</Text>
              </Pressable>
            </View>

            <View style={styles.dateRowWrap}>
              <View style={styles.dateChipPinned}>
                <Text style={styles.dateChipPinnedLabel}>SELECTED</Text>
                <Text style={styles.dateChipPinnedTop}>{pinnedTop}</Text>
                <Text style={styles.dateChipPinnedDay}>{pinnedDay}</Text>
                <Text style={styles.dateChipPinnedMon}>{pinnedMon}</Text>
              </View>

              <FlatList
                style={styles.dateList}
                horizontal
                data={travelDates}
                keyExtractor={(item) => item.key}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                onEndReachedThreshold={0.7}
                onEndReached={() => setVisibleDateCount((count) => count + 30)}
                renderItem={({ item }) => {
                  const active = selectedDate === item.key;
                  return (
                    <Pressable style={[styles.dateChip, active && styles.dateChipActive]} onPress={() => setSelectedDate(item.key)}>
                      <Text style={[styles.dateChipTop, active && styles.dateChipTopActive]}>{item.top}</Text>
                      <Text style={[styles.dateChipDay, active && styles.dateChipDayActive]}>{item.day}</Text>
                      <Text style={[styles.dateChipMon, active && styles.dateChipMonActive]}>{item.mon}</Text>
                    </Pressable>
                  );
                }}
              />
            </View>

            <Text style={styles.sectionLabel}>PREFERENCES</Text>
            <View style={styles.prefRow}>
              <PrefItem
                icon="snow-outline"
                label="AC"
                active={selectedPref === "AC"}
                onPress={() => setSelectedPref("AC")}
              />
              <PrefItem
                icon="time-outline"
                label="Sleeper"
                active={selectedPref === "Sleeper"}
                onPress={() => setSelectedPref("Sleeper")}
              />
              <PrefItem
                icon="flash-outline"
                label="Direct"
                active={selectedPref === "Direct"}
                onPress={() => setSelectedPref("Direct")}
              />
            </View>

            <Text style={styles.sectionLabel}>SUGGESTED ROUTES</Text>
            <View style={styles.recentWrap}>
              {suggestedLoading ? (
                <View style={styles.suggestedLoadingRow}>
                  <ActivityIndicator color="#7EB5F6" />
                  <Text style={styles.suggestedLoadingText}>Loading routes from Firebase…</Text>
                </View>
              ) : null}
              {!suggestedLoading && suggestedRoutes.length === 0 ? (
                <Text style={styles.suggestedEmpty}>No routes available. Check your connection and API.</Text>
              ) : null}
              {!suggestedLoading &&
                suggestedRoutes.map((r) => (
                  <SuggestedRouteRow
                    key={r.id}
                    title={`${r.origin} → ${r.destination}`}
                    subtitle={catalogRouteSubtitle(r)}
                    badge={passengerRouteCode(r.routeId, r.shortRouteId)}
                    onPress={() => applySuggestedRoute(r)}
                  />
                ))}
            </View>

            <Pressable
              style={styles.button}
              onPress={async () => {
                const manualFrom: Place | null = from.trim()
                  ? (fromPlace ?? {
                      id: `manual-from-${from.trim()}`,
                      name: from.trim(),
                      displayName: from.trim(),
                      lat: 0,
                      lon: 0,
                    })
                  : null;
                const manualTo: Place | null = to.trim()
                  ? (toPlace ?? {
                      id: `manual-to-${to.trim()}`,
                      name: to.trim(),
                      displayName: to.trim(),
                      lat: 0,
                      lon: 0,
                    })
                  : null;
                const result = await search({ from: manualFrom, to: manualTo, travelDateKey: selectedDate });
                navigation.navigate("AvailableBuses", {
                  from,
                  to,
                  fromPlace: manualFrom ?? undefined,
                  toPlace: manualTo ?? undefined,
                  travelDateKey: selectedDate,
                  initialResults: result?.data ?? [],
                  initialError: result?.error ?? null,
                });
              }}
            >
              <Ionicons name="search-outline" size={18} color="#0A1A2B" />
              <Text style={styles.buttonText}>Search Buses</Text>
            </Pressable>
            <Text style={styles.footerHint}>Search across 40+ transit partners in real-time</Text>
          </ScrollView>

        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function PrefItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.prefChip, active && styles.prefChipActive]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={active ? "#D8EAFE" : "#8DA4BD"} />
      <Text style={[styles.prefText, active && styles.prefTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SuggestedRouteRow({
  title,
  subtitle,
  badge,
  onPress,
}: {
  title: string;
  subtitle: string;
  badge: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.recentRow, pressed && styles.recentRowPressed]} onPress={onPress}>
      <View style={styles.suggestedRowMain}>
        <View style={styles.clockIcon}>
          <Ionicons name="bus-outline" size={13} color="#9CB3CC" />
        </View>
        <View style={styles.recentTextCol}>
          <Text style={styles.recentTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.recentSub} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.routeCodePill}>
        <Text style={styles.routeCodePillText} numberOfLines={1}>
          {badge}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  headerRow: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#172332",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerPlaceholder: { width: 20, height: 20 },
  title: { color: "#E6F1FC", fontSize: 18, fontWeight: "800" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionHeading: { color: "#E9F3FE", fontSize: 32, fontWeight: "900" },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#124028",
    borderWidth: 1,
    borderColor: "#1A5B39",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedPillText: { color: "#C0F0CB", fontSize: 11, fontWeight: "800" },
  inputStack: {
    marginBottom: 16,
    position: "relative",
    gap: 10,
    zIndex: 50,
  },
  locationNote: { color: "#9EB4CB", fontSize: 11, marginTop: -4 },
  /** Sits between From and To, right-aligned like the original floating control. */
  swapBetweenRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 12,
    marginTop: -18,
    marginBottom: -18,
    zIndex: 60,
    elevation: 8,
  },
  swapBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#142133",
    borderWidth: 1,
    borderColor: "#213247",
    alignItems: "center",
    justifyContent: "center",
  },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  blockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  blockTitle: { color: "#D3DFED", fontSize: 15, fontWeight: "800" },
  calendarText: { color: "#6FA4E7", fontSize: 12, fontWeight: "700" },
  dateRowWrap: { flexDirection: "row", gap: 10, marginBottom: 18 },
  dateList: { flex: 1 },
  chipRow: { gap: 8, paddingRight: 8 },
  dateChipPinned: {
    width: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3F6F9F",
    backgroundColor: "#234E7A",
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 8,
  },
  dateChipPinnedLabel: { color: "#C9E4FF", fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  dateChipPinnedTop: { color: "#DDEEFF", fontSize: 10, fontWeight: "900", marginTop: 1 },
  dateChipPinnedDay: { color: "#F4FAFF", fontSize: 22, fontWeight: "900", lineHeight: 24, marginVertical: 1 },
  dateChipPinnedMon: { color: "#D2E8FF", fontSize: 11, fontWeight: "800" },
  dateChip: {
    width: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24384D",
    backgroundColor: "#121E2B",
    alignItems: "center",
    paddingVertical: 9,
  },
  dateChipActive: { backgroundColor: "#4E93D1", borderColor: "#4E93D1" },
  dateChipTop: { color: "#9FB5CC", fontSize: 10, fontWeight: "800" },
  dateChipTopActive: { color: "#10243C" },
  dateChipDay: { color: "#EEF6FE", fontSize: 20, fontWeight: "900", lineHeight: 23, marginVertical: 2 },
  dateChipDayActive: { color: "#10243C" },
  dateChipMon: { color: "#A8BED5", fontSize: 11, fontWeight: "700" },
  dateChipMonActive: { color: "#10243C" },
  sectionLabel: { color: "#C6D5E6", fontSize: 15, fontWeight: "900", marginBottom: 10, letterSpacing: 0.6 },
  prefRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  prefChip: {
    flex: 1,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24384B",
    backgroundColor: "#111C2A",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  prefChipActive: { backgroundColor: "#15283D", borderColor: "#335678" },
  prefText: { color: "#B8CADE", fontSize: 13, fontWeight: "800" },
  prefTextActive: { color: "#DDEBFA" },
  recentWrap: { gap: 10, marginBottom: 18 },
  suggestedLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  suggestedLoadingText: { color: "#98AEC7", fontSize: 13, fontWeight: "600" },
  suggestedEmpty: { color: "#98AEC7", fontSize: 13, lineHeight: 18, paddingVertical: 8 },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#111C2A",
    borderWidth: 1,
    borderColor: "#1E3146",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  recentRowPressed: { opacity: 0.88, borderColor: "#2A4A68" },
  suggestedRowMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  recentTextCol: { flex: 1, minWidth: 0 },
  clockIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0E1623",
    borderWidth: 1,
    borderColor: "#1E2D3F",
    alignItems: "center",
    justifyContent: "center",
  },
  recentTitle: { color: "#EAF3FF", fontSize: 17, fontWeight: "800" },
  recentSub: { color: "#98AEC7", fontSize: 12, marginTop: 2 },
  routeCodePill: {
    flexShrink: 0,
    maxWidth: "34%",
    backgroundColor: "#10253D",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  routeCodePillText: { color: "#7EB5F6", fontSize: 12, fontWeight: "800", textAlign: "center" },
  button: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#5B9FE2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonText: { color: "#081A2D", fontWeight: "900", fontSize: 18 },
  footerHint: { color: "#8AA1B9", textAlign: "center", fontSize: 12, marginTop: 10, marginBottom: 8 },
});
