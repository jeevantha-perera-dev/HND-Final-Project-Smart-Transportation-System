import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const BG = "#000000";
const SURFACE = "#1C1C1E";
const SKY = "#5EB3F6";
const SKY_DIM = "#4A9FE8";
const TEXT = "#FFFFFF";
const MUTED = "#8E8E93";
const CARD_DARK = "#2C2C2E";
const ORANGE = "#FF9F0A";

const REWARDS = [
  {
    id: "1",
    title: "Free Weekly Pass",
    progress: 0.85,
    label: "85% Completed",
    icon: "bus" as const,
    iconBg: SKY,
  },
  {
    id: "2",
    title: "Cashback Booster",
    progress: 0.4,
    label: "40% Completed",
    icon: "flash" as const,
    iconBg: "#34C759",
  },
] as const;

const ACTIVITY = [
  {
    id: "a1",
    title: "Route 42 - Downtown",
    time: "Today, 09:45 AM",
    amount: "-2.50",
    tone: "blue" as const,
    icon: "bus" as const,
  },
  {
    id: "a2",
    title: "Wallet Top-up",
    time: "Yesterday, 4:12 PM",
    amount: "+50.00",
    tone: "green" as const,
    icon: "arrow-up" as const,
  },
  {
    id: "a3",
    title: "Monthly Loyalty Reward",
    time: "Mon, 18 Mar",
    amount: "+5.00",
    tone: "orange" as const,
    icon: "gift" as const,
  },
  {
    id: "a4",
    title: "Route 105-Express",
    time: "Mon, 21,Oct",
    amount: "-4.75",
    tone: "blue" as const,
    icon: "bus" as const,
  },
  {
    id: "a5",
    title: "Transfer to J.Smith",
    time: "Mon, 20,Oct",
    amount: "-12.00",
    tone: "green" as const,
    icon: "arrow-up" as const,
  },
] as const;

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const tabBarPad = 72;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <Pressable hitSlop={12} style={styles.headerPlus}>
            <Ionicons name="add" size={26} color={SKY} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarPad + insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.balanceCard}>
            <View style={styles.balanceTop}>
              <View>
                <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
                <Text style={styles.balanceAmount}>$428.50</Text>
              </View>
              <Ionicons name="wallet-outline" size={28} color="#0A1628" />
            </View>
            <View style={styles.balanceBottom}>
              <View>
                <Text style={styles.pointsLabel}>TransitFlow Points</Text>
                <View style={styles.pointsRow}>
                  <View style={styles.coinIcon} />
                  <Text style={styles.pointsValue}>1,240 pts</Text>
                </View>
              </View>
              <View style={styles.decorCircles}>
                <View style={[styles.decorCircle, styles.decorCircleBack]} />
                <View style={[styles.decorCircle, styles.decorCircleFront]} />
              </View>
            </View>
          </View>

          <View style={styles.quickRow}>
            <Pressable style={styles.quickAdd}>
              <Ionicons name="add" size={22} color={SKY} />
              <Text style={styles.quickAddText}>Add Money</Text>
            </Pressable>
            <Pressable style={styles.quickSolid}>
              <Ionicons name="arrow-up-right" size={22} color={TEXT} />
              <Text style={styles.quickSolidText}>Transfer</Text>
            </Pressable>
            <Pressable style={styles.quickSolid}>
              <Ionicons name="card-outline" size={22} color={TEXT} />
              <Text style={styles.quickSolidText}>Vouchers</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHead}>
            <View style={styles.sectionHeadLeft}>
              <Ionicons name="trending-up" size={18} color={SKY} />
              <Text style={styles.sectionTitle}>Earned Rewards</Text>
            </View>
            <Pressable>
              <Text style={styles.link}>View All</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rewardsScroll}
          >
            {REWARDS.map((r) => (
              <View key={r.id} style={styles.rewardCard}>
                <View style={[styles.rewardIconBox, { backgroundColor: r.iconBg }]}>
                  <Ionicons name={r.icon} size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.rewardTitle}>{r.title}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${r.progress * 100}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{r.label}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.sectionHead}>
            <View style={styles.sectionHeadLeft}>
              <Ionicons name="time-outline" size={18} color={SKY} />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
            <Pressable>
              <Text style={styles.link}>History</Text>
            </Pressable>
          </View>

          <View style={styles.activityCard}>
            {ACTIVITY.map((row, i) => (
              <View key={row.id}>
                {i > 0 ? <View style={styles.activityDivider} /> : null}
                <View style={styles.activityRow}>
                  <View
                    style={[
                      styles.activityIcon,
                      row.tone === "blue" && { backgroundColor: "rgba(94, 179, 246, 0.25)" },
                      row.tone === "green" && { backgroundColor: "rgba(52, 199, 89, 0.25)" },
                      row.tone === "orange" && { backgroundColor: "rgba(255, 159, 10, 0.25)" },
                    ]}
                  >
                    <Ionicons
                      name={row.icon === "bus" ? "bus" : row.icon === "arrow-up" ? "arrow-up" : "gift"}
                      size={18}
                      color={
                        row.tone === "blue" ? SKY : row.tone === "green" ? "#34C759" : ORANGE
                      }
                    />
                  </View>
                  <View style={styles.activityCenter}>
                    <Text style={styles.activityTitle}>{row.title}</Text>
                    <Text style={styles.activityTime}>{row.time}</Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>{row.amount}</Text>
                    <View style={styles.successPill}>
                      <Text style={styles.successPillText}>Successful</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            <Pressable style={styles.statementLink}>
              <Text style={styles.statementText}>View Full Statement</Text>
              <Ionicons name="chevron-forward" size={16} color={SKY} />
            </Pressable>
          </View>
        </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: TEXT, fontSize: 28, fontWeight: "800" },
  headerPlus: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },
  balanceCard: {
    backgroundColor: SKY,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    overflow: "hidden",
  },
  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  balanceLabel: {
    color: "#1A2F4A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  balanceAmount: {
    color: "#0A1628",
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  balanceBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  pointsLabel: { color: "#1A2F4A", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ORANGE,
    borderWidth: 1,
    borderColor: "#FFB340",
  },
  pointsValue: { color: "#0A1628", fontSize: 16, fontWeight: "800" },
  decorCircles: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  decorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  decorCircleBack: { marginRight: -18, opacity: 0.5 },
  decorCircleFront: { borderWidth: 2, borderColor: "rgba(255,255,255,0.5)" },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  quickAdd: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: SKY_DIM,
    backgroundColor: "transparent",
    gap: 6,
  },
  quickAddText: { color: SKY, fontSize: 12, fontWeight: "700" },
  quickSolid: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: CARD_DARK,
    gap: 6,
  },
  quickSolidText: { color: TEXT, fontSize: 12, fontWeight: "700" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeadLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: TEXT, fontSize: 17, fontWeight: "800" },
  link: { color: SKY, fontSize: 14, fontWeight: "700" },
  rewardsScroll: { gap: 12, paddingBottom: 4 },
  rewardCard: {
    width: 200,
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  rewardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  rewardTitle: { color: TEXT, fontSize: 15, fontWeight: "800", marginBottom: 12 },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#333336",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: SKY,
  },
  progressLabel: { color: MUTED, fontSize: 12, fontWeight: "600" },
  activityCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  activityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#38383A",
    marginLeft: 68,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  activityCenter: { flex: 1, minWidth: 0 },
  activityTitle: { color: TEXT, fontSize: 15, fontWeight: "800" },
  activityTime: { color: MUTED, fontSize: 12, marginTop: 3 },
  activityRight: { alignItems: "flex-end" },
  activityAmount: { color: TEXT, fontSize: 15, fontWeight: "800" },
  successPill: {
    marginTop: 6,
    backgroundColor: "#2C2C2E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  successPillText: { color: MUTED, fontSize: 10, fontWeight: "600" },
  statementLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#38383A",
  },
  statementText: { color: SKY, fontSize: 14, fontWeight: "700" },
});
