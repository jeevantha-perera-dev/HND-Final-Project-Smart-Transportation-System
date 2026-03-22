import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";

const BG = "#121212";
const SURFACE = "#1C1C1E";
const BORDER = "#38383A";
const PRIMARY = "#4A90E2";
const TEXT = "#FFFFFF";
const MUTED = "#8E8E93";

const ROWS = [1, 2, 3, 4, 5] as const;

/** Reserved / locked seats (includes 1A & 1B per accessibility banner) */
const RESERVED_IDS = new Set(["1A", "1B", "2B", "3C", "4A"]);

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "SeatSelection">;

export default function SeatSelectionScreen({ navigation, route }: Props) {
  const { busId = "—", routeName = "Route", price = "$0.00" } = route.params ?? {};
  const baseFare = useMemo(() => {
    const n = parseFloat(String(price).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [price]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalFare = useMemo(() => {
    if (!selectedId) return baseFare;
    return baseFare;
  }, [selectedId, baseFare]);

  const totalLabel = `$${totalFare.toFixed(2)}`;

  function toggleSeat(id: string) {
    if (RESERVED_IDS.has(id)) return;
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Select Your Seat
          </Text>
          <Pressable hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="information-circle-outline" size={22} color={TEXT} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.legend}>
            <LegendDot color="#34C759" label="Available" />
            <LegendDot color="#FF453A" label="Reserved" />
            <LegendDot color={PRIMARY} label="Selected" />
          </View>

          <View style={styles.busShell}>
            <View style={styles.driverBlock}>
              <Ionicons name="person" size={22} color={MUTED} />
              <Text style={styles.driverLabel}>DRIVER</Text>
            </View>

            {ROWS.map((row) => (
              <View key={row} style={styles.seatRow}>
                <Text style={styles.rowNum}>{row}</Text>
                <SeatTile
                  id={`${row}A`}
                  reserved={RESERVED_IDS.has(`${row}A`)}
                  selected={selectedId === `${row}A`}
                  onPress={() => toggleSeat(`${row}A`)}
                />
                <SeatTile
                  id={`${row}B`}
                  reserved={RESERVED_IDS.has(`${row}B`)}
                  selected={selectedId === `${row}B`}
                  onPress={() => toggleSeat(`${row}B`)}
                />
                <View style={styles.aisle} />
                <SeatTile
                  id={`${row}C`}
                  reserved={RESERVED_IDS.has(`${row}C`)}
                  selected={selectedId === `${row}C`}
                  onPress={() => toggleSeat(`${row}C`)}
                />
                <SeatTile
                  id={`${row}D`}
                  reserved={RESERVED_IDS.has(`${row}D`)}
                  selected={selectedId === `${row}D`}
                  onPress={() => toggleSeat(`${row}D`)}
                />
              </View>
            ))}

            <DottedRule />
            <View style={styles.rearExitWrap}>
              <View style={styles.rearExitPill}>
                <Text style={styles.rearExitText}>Rear Exit Nearby</Text>
              </View>
            </View>
          </View>

          <View style={styles.accessBanner}>
            <Ionicons name="information-circle" size={22} color={TEXT} style={styles.accessIcon} />
            <View style={styles.accessTextWrap}>
              <Text style={styles.accessTitle}>Accessibility Priority</Text>
              <Text style={styles.accessBody}>
                Seats 1A and 1B are reserved for passengers with limited mobility or disabilities.
              </Text>
            </View>
          </View>

          <Text style={styles.routeMeta} numberOfLines={1}>
            {busId} · {routeName}
          </Text>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerLabel}>Selected Seats</Text>
              {selectedId ? (
                <View style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>{selectedId}</Text>
                </View>
              ) : (
                <Text style={styles.footerPlaceholder}>None</Text>
              )}
            </View>
            <View style={styles.fareCol}>
              <Text style={styles.footerLabel}>Total Fare</Text>
              <Text style={styles.fareValue}>{totalLabel}</Text>
            </View>
          </View>

          <Pressable
            style={[styles.confirmBtn, !selectedId && styles.confirmBtnDisabled]}
            disabled={!selectedId}
            onPress={() => {
              if (!selectedId) return;
              navigation.navigate("Checkout", {
                busId,
                routeName,
                price,
                seatId: selectedId,
              });
            }}
          >
            <Text style={styles.confirmBtnText}>Confirm Selection</Text>
            <Ionicons name="chevron-forward" size={18} color="#0A1628" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DottedRule() {
  return (
    <View style={styles.dottedRule}>
      {Array.from({ length: 28 }).map((_, i) => (
        <View key={i} style={styles.dot} />
      ))}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function SeatTile({
  id,
  reserved,
  selected,
  onPress,
}: {
  id: string;
  reserved: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.seat,
        reserved && styles.seatReserved,
        selected && !reserved && styles.seatSelected,
      ]}
    >
      {reserved ? (
        <>
          <Ionicons name="lock-closed" size={12} color={MUTED} />
          <Text style={styles.seatIdReserved}>{id}</Text>
        </>
      ) : (
        <>
          <Ionicons
            name="square-outline"
            size={11}
            color={selected ? TEXT : MUTED}
            style={styles.seatGlyph}
          />
          <Text style={[styles.seatId, selected && styles.seatIdOn]}>{id}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  headerIcon: { width: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: TEXT, fontSize: 17, fontWeight: "700", textAlign: "left" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: TEXT, fontSize: 13, fontWeight: "600" },
  busShell: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  driverBlock: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  driverLabel: { color: MUTED, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginTop: 4 },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  rowNum: {
    width: 18,
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  aisle: {
    width: 14,
    marginHorizontal: 2,
    alignSelf: "stretch",
    minHeight: 48,
    borderRadius: 4,
    backgroundColor: "#141416",
  },
  seat: {
    flex: 1,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#48484A",
    backgroundColor: "#2C2C2E",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 6,
  },
  seatReserved: {
    backgroundColor: "#3A3A3C",
    borderColor: "#4A4A4C",
  },
  seatSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  seatGlyph: { marginBottom: 0 },
  seatId: { color: TEXT, fontSize: 12, fontWeight: "800" },
  seatIdOn: { color: TEXT },
  seatIdReserved: { color: "#636366", fontSize: 11, fontWeight: "700" },
  dottedRule: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
    marginBottom: 10,
  },
  dot: {
    width: 5,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#48484A",
  },
  rearExitWrap: { alignItems: "center" },
  rearExitPill: {
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rearExitText: { color: MUTED, fontSize: 11, fontWeight: "600" },
  accessBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    gap: 10,
  },
  accessIcon: { marginTop: 2 },
  accessTextWrap: { flex: 1 },
  accessTitle: { color: TEXT, fontSize: 15, fontWeight: "800", marginBottom: 6 },
  accessBody: { color: TEXT, fontSize: 13, lineHeight: 18, opacity: 0.95 },
  routeMeta: { color: MUTED, fontSize: 12, marginTop: 14, textAlign: "center" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  footerLabel: { color: MUTED, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  footerPlaceholder: { color: "#636366", fontSize: 15, fontWeight: "600" },
  seatBadge: {
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  seatBadgeText: { color: TEXT, fontSize: 14, fontWeight: "800" },
  fareCol: { alignItems: "flex-end" },
  fareValue: { color: TEXT, fontSize: 24, fontWeight: "800" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: { color: "#0A1628", fontSize: 16, fontWeight: "800" },
});
