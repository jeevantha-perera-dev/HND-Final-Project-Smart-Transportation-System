import { Ionicons } from "@expo/vector-icons";
import { CommonActions } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";
import { confirmBooking, seatLock } from "../../../services/api/booking";
import { getWallet } from "../../../services/api/wallet";

const BG = "#0D0D0F";
const CARD_BLUE = "#152238";
const CARD_GRAY = "#1C1C1E";
const BORDER = "#2C3E50";
const PRIMARY = "#4A90E2";
const TEXT = "#FFFFFF";
const MUTED = "#8E8E93";
const GREEN = "#34C759";

type PaymentId = "visa" | "apple" | "netbank";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "Checkout">;

export default function CheckoutScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const {
    busId,
    routeName,
    price,
    tripId,
    seatId,
    fromStop = "St. Johns Terminal",
    toStop = "Central Plaza",
  } = route.params;

  const baseFare = useMemo(() => {
    const n = parseFloat(String(price).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }, [price]);

  const breakdown = useMemo(() => {
    const adultBase = baseFare;
    const bookingFee = 1.5;
    const sub = adultBase + bookingFee;
    const tax = Math.round(sub * 0.05 * 100) / 100;
    const loyaltyDiscount = -2.0;
    const total = Math.max(0, sub + tax + loyaltyDiscount);
    return {
      adultBase,
      bookingFee,
      tax,
      loyaltyDiscount,
      total,
    };
  }, [baseFare]);

  const [payment, setPayment] = useState<PaymentId>("visa");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoaded, setWalletLoaded] = useState(false);

  const totalStr = `$${breakdown.total.toFixed(2)}`;
  useEffect(() => {
    (async () => {
      try {
        const wallet = await getWallet();
        setWalletBalance(wallet.balance);
      } finally {
        setWalletLoaded(true);
      }
    })();
  }, []);

  async function handleConfirmAndPay() {
    if (!tripId) {
      setError("Trip identifier is missing.");
      return;
    }
    setError(null);
    try {
      setSubmitting(true);
      const lock = await seatLock({
        tripId,
        seatId,
        amount: breakdown.total,
      });
      await confirmBooking(lock.bookingId);
      const tabNav = navigation.getParent();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "HomeMain" }],
        })
      );
      setTimeout(() => {
        tabNav?.navigate("Wallet" as never);
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Pressable hitSlop={12} style={styles.headerIcon}>
            <Ionicons name="shield-checkmark-outline" size={22} color={PRIMARY} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.routeCard}>
            <View style={styles.routeCardTop}>
              <Text style={styles.routeLabel}>ROUTE</Text>
              <View style={styles.oneWayBadge}>
                <Text style={styles.oneWayText}>One Way</Text>
              </View>
            </View>
            <Text style={styles.routeTitle}>
              {routeName} #{busId}
            </Text>
            <Text style={styles.routeSub}>
              {fromStop} → {toStop}
            </Text>
            <View style={styles.routeMetaRow}>
              <Ionicons name="globe-outline" size={16} color={PRIMARY} />
              <Text style={styles.routeMetaText}>
                Coach Class · Seat: {seatId}
              </Text>
            </View>
          </View>

          <View style={styles.fareCard}>
            <View style={styles.fareHeader}>
              <Ionicons name="ticket-outline" size={20} color={PRIMARY} />
              <Text style={styles.fareHeaderTitle}>Fare Breakdown</Text>
            </View>
            <FareLine label="Adult Base Fare (x1)" amount={`$${breakdown.adultBase.toFixed(2)}`} />
            <FareLine label="Booking Fee" amount={`$${breakdown.bookingFee.toFixed(2)}`} />
            <FareLine label="Service Tax (5%)" amount={`$${breakdown.tax.toFixed(2)}`} />
            <FareLine
              label="Loyalty Discount"
              amount={`$${breakdown.loyaltyDiscount.toFixed(2)}`}
              accentGreen
            />
            <View style={styles.fareDivider} />
            <View style={styles.fareTotalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{totalStr}</Text>
            </View>
          </View>

          <Pressable style={styles.walletCard}>
            <View style={styles.walletIconWrap}>
              <Ionicons name="wallet" size={22} color={PRIMARY} />
            </View>
            <View style={styles.walletCenter}>
              <Text style={styles.walletLabel}>TRANSITFLOW WALLET</Text>
              <Text style={styles.walletBalance}>
                {walletLoaded ? `$${walletBalance.toFixed(2)}` : "Loading..."}
              </Text>
            </View>
            <View style={styles.walletRight}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </View>
          </Pressable>

          <Text style={styles.sectionTitle}>PAYMENT METHODS</Text>

          <PaymentOption
            selected={payment === "visa"}
            onSelect={() => setPayment("visa")}
            icon="card-outline"
            title="Visa Classic"
            subtitle="•••• 4242"
          />
          <PaymentOption
            selected={payment === "apple"}
            onSelect={() => setPayment("apple")}
            icon="phone-portrait-outline"
            title="Apple Pay"
            subtitle="Express checkout enabled"
          />
          <PaymentOption
            selected={payment === "netbank"}
            onSelect={() => setPayment("netbank")}
            icon="business-outline"
            title="Net Banking"
            subtitle="All major banks supported"
          />

          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={[styles.stickyFooter, { paddingBottom: Math.max(10, insets.bottom) }]}>
          <View style={styles.footerTopRow}>
            <View>
              <Text style={styles.finalLabel}>FINAL AMOUNT</Text>
              <Text style={styles.finalAmount}>{totalStr}</Text>
            </View>
            <View style={styles.footerRightCol}>
              <Text style={styles.secureText}>Secure Booking</Text>
              <Text style={styles.taxNote}>Inc. all taxes</Text>
            </View>
          </View>
          <Pressable
            style={styles.payBtn}
            onPress={handleConfirmAndPay}
            disabled={submitting}
          >
            <Text style={styles.payBtnText}>
              {submitting ? "Processing..." : `Confirm & Pay ${totalStr}`}
            </Text>
          </Pressable>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

function FareLine({
  label,
  amount,
  accentGreen,
}: {
  label: string;
  amount: string;
  accentGreen?: boolean;
}) {
  return (
    <View style={styles.fareLine}>
      <Text style={[styles.fareLineLabel, accentGreen && styles.fareLineGreen]}>{label}</Text>
      <Text style={[styles.fareLineAmount, accentGreen && styles.fareLineGreen]}>{amount}</Text>
    </View>
  );
}

function PaymentOption({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.payCard, selected && styles.payCardSelected]}
    >
      <View style={styles.payIconBox}>
        <Ionicons name={icon} size={22} color={TEXT} />
      </View>
      <View style={styles.payTextCol}>
        <Text style={styles.payTitle}>{title}</Text>
        <Text style={styles.paySubtitle}>{subtitle}</Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={24} color={PRIMARY} />
      ) : (
        <View style={styles.radioOuter}>
          <View style={styles.radioInner} />
        </View>
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
  headerTitle: { flex: 1, color: TEXT, fontSize: 18, fontWeight: "800", textAlign: "left" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  routeCard: {
    backgroundColor: CARD_BLUE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1E3A5A",
  },
  routeCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  routeLabel: { color: TEXT, fontSize: 13, fontWeight: "600", letterSpacing: 0.8 },
  oneWayBadge: {
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  oneWayText: { color: TEXT, fontSize: 12, fontWeight: "700" },
  routeTitle: { color: TEXT, fontSize: 22, fontWeight: "800", marginBottom: 6 },
  routeSub: { color: TEXT, fontSize: 15, fontWeight: "500", marginBottom: 10 },
  routeMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeMetaText: { color: PRIMARY, fontSize: 14, fontWeight: "600" },
  fareCard: {
    backgroundColor: CARD_GRAY,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  fareHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  fareHeaderTitle: { color: TEXT, fontSize: 17, fontWeight: "800" },
  fareLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  fareLineLabel: { color: MUTED, fontSize: 14, fontWeight: "500" },
  fareLineAmount: { color: TEXT, fontSize: 14, fontWeight: "800" },
  fareLineGreen: { color: GREEN },
  fareDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
    marginVertical: 8,
  },
  fareTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: TEXT, fontSize: 16, fontWeight: "800" },
  totalValue: { color: PRIMARY, fontSize: 22, fontWeight: "800" },
  walletCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BLUE,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1E3A5A",
    gap: 12,
  },
  walletIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(74, 144, 226, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletCenter: { flex: 1 },
  walletLabel: { color: PRIMARY, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4 },
  walletBalance: { color: TEXT, fontSize: 22, fontWeight: "800" },
  walletRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  activeBadge: {
    backgroundColor: "rgba(52, 199, 89, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeBadgeText: { color: GREEN, fontSize: 11, fontWeight: "800" },
  sectionTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  payCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_GRAY,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
  },
  payCardSelected: { borderColor: PRIMARY, borderWidth: 2 },
  payIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#141416",
    alignItems: "center",
    justifyContent: "center",
  },
  payTextCol: { flex: 1 },
  payTitle: { color: TEXT, fontSize: 16, fontWeight: "700" },
  paySubtitle: { color: MUTED, fontSize: 12, marginTop: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: MUTED,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 0, height: 0 },
  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  footerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  finalLabel: { color: MUTED, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4 },
  finalAmount: { color: TEXT, fontSize: 26, fontWeight: "800" },
  footerRightCol: { alignItems: "flex-end" },
  secureText: { color: TEXT, fontSize: 13, fontWeight: "600" },
  taxNote: { color: MUTED, fontSize: 11, fontStyle: "italic", marginTop: 4 },
  payBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnText: { color: "#0A1628", fontSize: 16, fontWeight: "800" },
  errorText: {
    color: "#FF9F9F",
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
});
