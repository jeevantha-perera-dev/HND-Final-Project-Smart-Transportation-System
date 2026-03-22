import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";

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

type Crowd = "low" | "medium" | "high";

type BusOption = {
  id: string;
  routeName: string;
  arrivalMins: number;
  seatsLeft: number;
  predictedSeats: number;
  price: string;
  express?: boolean;
  crowd: Crowd;
};

const MOCK_BUSES: BusOption[] = [
  {
    id: "X-104",
    routeName: "Downtown Express",
    arrivalMins: 4,
    seatsLeft: 14,
    predictedSeats: 18,
    price: "$3.50",
    express: true,
    crowd: "low",
  },
  {
    id: "202",
    routeName: "Crosstown Central",
    arrivalMins: 12,
    seatsLeft: 6,
    predictedSeats: 4,
    price: "$2.75",
    crowd: "medium",
  },
  {
    id: "A-12",
    routeName: "Airport Link",
    arrivalMins: 18,
    seatsLeft: 3,
    predictedSeats: 2,
    price: "$4.00",
    express: true,
    crowd: "high",
  },
  {
    id: "B-88",
    routeName: "Harbor Loop",
    arrivalMins: 22,
    seatsLeft: 20,
    predictedSeats: 22,
    price: "$2.50",
    crowd: "low",
  },
];

const SORT_FILTERS = ["Recommended", "Cheapest", "Earliest", "Express"] as const;

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "AvailableBuses">;

export default function AvailableBusesScreen({ navigation }: Props) {
  const [sortBy, setSortBy] = useState<(typeof SORT_FILTERS)[number]>("Recommended");

  const buses = useMemo(() => {
    const copy = [...MOCK_BUSES];
    if (sortBy === "Cheapest") copy.sort((a, b) => parseFloat(a.price.slice(1)) - parseFloat(b.price.slice(1)));
    if (sortBy === "Earliest") copy.sort((a, b) => a.arrivalMins - b.arrivalMins);
    if (sortBy === "Express") copy.sort((a, b) => (b.express ? 1 : 0) - (a.express ? 1 : 0));
    return copy;
  }, [sortBy]);

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
          {buses.map((bus) => (
            <BusCard
              key={bus.id}
              bus={bus}
              onSelect={() =>
                navigation.navigate("SeatSelection", {
                  busId: bus.id,
                  routeName: bus.routeName,
                  price: bus.price,
                })
              }
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

function BusCard({ bus, onSelect }: { bus: BusOption; onSelect: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.busIdRow}>
          <Text style={styles.busId}>{bus.id}</Text>
          {bus.express ? (
            <View style={styles.expressTag}>
              <Text style={styles.expressTagText}>Express</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.arrivalCol}>
          <View style={styles.arrivalRow}>
            <Ionicons name="time-outline" size={15} color={BUS_ID_BLUE} />
            <Text style={styles.arrivalMins}>{bus.arrivalMins}m</Text>
            <Text style={styles.arrivingInline}> ARRIVING</Text>
          </View>
        </View>
      </View>

      <Text style={styles.routeName}>{bus.routeName}</Text>

      <View style={styles.seatsRow}>
        <Ionicons name="bus-outline" size={18} color={TEXT_MUTED} />
        <View style={styles.seatsLeftCol}>
          <Text style={styles.seatsLabel}>SEATS LEFT</Text>
          <Text style={styles.seatsValue}>{bus.seatsLeft} Available</Text>
        </View>
        <CrowdPill crowd={bus.crowd} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.predictionRow}>
        <Ionicons name="trending-up-outline" size={16} color={TEXT_MUTED} />
        <Text style={styles.predictionText}>
          Predicted Seats When Arrived:{" "}
          <Text style={styles.predictionHighlight}>
            {bus.predictedSeats} seats
          </Text>
        </Text>
        <Ionicons name="information-circle-outline" size={16} color={TEXT_MUTED} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.priceLabel}>SINGLE TRIP</Text>
          <Text style={styles.priceValue}>{bus.price}</Text>
        </View>
        <Pressable style={styles.selectBtn} onPress={onSelect}>
          <Text style={styles.selectBtnText}>Select</Text>
          <Ionicons name="chevron-forward" size={15} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

function CrowdPill({ crowd }: { crowd: Crowd }) {
  const cfg = {
    low: { label: "Low Crowd", bg: "#1A3D2A", fg: "#34C759", dot: "#34C759" },
    medium: { label: "Medium Crowd", bg: "#3D3010", fg: "#FF9F0A", dot: "#FF9F0A" },
    high: { label: "High Crowd", bg: "#3D1518", fg: "#FF453A", dot: "#FF453A" },
  }[crowd];

  return (
    <View style={[styles.crowdPill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.crowdDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.crowdText, { color: cfg.fg }]}>{cfg.label}</Text>
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
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  busIdRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  busId: { color: BUS_ID_BLUE, fontSize: 22, fontWeight: "800" },
  expressTag: {
    backgroundColor: "#2E2848",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3D3558",
  },
  expressTagText: { color: "#A995E8", fontSize: 11, fontWeight: "700" },
  arrivalCol: { alignItems: "flex-end", justifyContent: "center" },
  arrivalRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
  arrivalMins: { color: BUS_ID_BLUE, fontSize: 15, fontWeight: "700" },
  arrivingInline: {
    color: BUS_ID_BLUE,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  routeName: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
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
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  predictionText: {
    flex: 1,
    color: PREDICTION_PURPLE,
    fontSize: 12,
    fontWeight: "500",
    minWidth: "55%",
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
});
