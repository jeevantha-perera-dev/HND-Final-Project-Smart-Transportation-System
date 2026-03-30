import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NotificationCard, SectionHeader } from "../ui";
import { colors, spacing } from "../theme";
import type { PassengerTabsParamList } from "../types";
import { listPassengerAnnouncements, type PassengerAnnouncement } from "../../../services/api/notifications";
import { getWallet } from "../../../services/api/wallet";
import { loadPassengerBookingsForTripsScreen } from "../../../services/firebase/passengerBookings";
import type { MyBookingItem } from "../../../services/api/booking";

const READ_STORAGE_KEY = "@smartbus/passenger_notifications_read_v1";
const WALLET_LOW_LKR = 300;
const UPCOMING_WINDOW_MS = 48 * 60 * 60 * 1000;

const filters = ["All", "Delays", "Route Changes", "Security"] as const;
type Filter = (typeof filters)[number];

type FilterKey = Filter | "General";

type FeedItem = {
  id: string;
  filterKey: FilterKey;
  title: string;
  body: string;
  createdAt: Date;
  icon: keyof typeof Ionicons.glyphMap;
  important: boolean;
  optionalActionLabel?: string;
  onOptionalActionPress?: () => void;
};

function formatNotificationTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "JUST NOW";
  if (mins < 60) return `${mins} MIN${mins === 1 ? "" : "S"} AGO`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} HOUR${hrs === 1 ? "" : "S"} AGO`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "YESTERDAY";
  if (days < 7) return `${days} DAYS AGO`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
}

function normalizeFilterKey(raw: string): FilterKey {
  const c = raw.trim();
  if (c === "Delays") return "Delays";
  if (c === "Route Changes") return "Route Changes";
  if (c === "Security") return "Security";
  return "General";
}

function iconForCategory(key: FilterKey): keyof typeof Ionicons.glyphMap {
  switch (key) {
    case "Delays":
      return "alert-circle-outline";
    case "Route Changes":
      return "git-compare-outline";
    case "Security":
      return "shield-checkmark-outline";
    default:
      return "information-circle-outline";
  }
}

function announcementToFeed(a: PassengerAnnouncement): FeedItem {
  const fk = normalizeFilterKey(a.category);
  return {
    id: `api-${a.id}`,
    filterKey: fk,
    title: a.title,
    body: a.body,
    createdAt: new Date(a.createdAt),
    icon: iconForCategory(fk),
    important: a.important,
  };
}

function buildWalletItem(balance: number, onTopUp: () => void): FeedItem {
  return {
    id: "local-wallet-low",
    filterKey: "Security",
    title: "Low wallet balance",
    body: `You have LKR ${balance.toFixed(0)}. Top up so you can book tickets without interruption.`,
    createdAt: new Date(),
    icon: "wallet-outline",
    important: true,
    optionalActionLabel: "Top up wallet",
    onOptionalActionPress: onTopUp,
  };
}

function buildBookingItems(bookings: MyBookingItem[]): FeedItem[] {
  const now = Date.now();
  const limit = now + UPCOMING_WINDOW_MS;
  const out: FeedItem[] = [];
  for (const b of bookings) {
    if (b.status !== "CONFIRMED") continue;
    const depRaw = b.trip?.departureAt ?? b.tripSnapshot?.departureAt;
    if (!depRaw) continue;
    const t = new Date(depRaw).getTime();
    if (Number.isNaN(t) || t < now || t > limit) continue;
    const route = b.trip?.routeName ?? b.tripSnapshot?.routeName ?? "Your trip";
    const when = new Date(depRaw).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    out.push({
      id: `local-trip-${b.id}`,
      filterKey: "Route Changes",
      title: "Upcoming journey",
      body: `${route} — departing ${when}. Seat ${b.seatId}.`,
      createdAt: new Date(t),
      icon: "bus-outline",
      important: true,
    });
  }
  return out;
}

async function loadReadIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map(String));
  } catch {
    return new Set();
  }
}

async function persistReadIds(ids: Set<string>) {
  try {
    await AsyncStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<PassengerTabsParamList>>();
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const goTopUp = useCallback(() => {
    navigation.navigate("Wallet", { screen: "AddMoney" });
  }, [navigation]);

  const goTrips = useCallback(() => {
    navigation.navigate("Trips");
  }, [navigation]);

  const mergeFeed = useCallback(
    async (announcements: PassengerAnnouncement[], bookings: MyBookingItem[], balance: number | null) => {
      const fromApi = announcements.map(announcementToFeed);
      const fromBookings = buildBookingItems(bookings).map((b) => ({
        ...b,
        optionalActionLabel: "View trips",
        onOptionalActionPress: goTrips,
      }));
      const walletItem =
        balance != null && balance < WALLET_LOW_LKR ? buildWalletItem(balance, goTopUp) : null;
      const merged = [...(walletItem ? [walletItem] : []), ...fromBookings, ...fromApi];
      merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setFeedItems(merged);
    },
    [goTopUp, goTrips]
  );

  const load = useCallback(
    async (mode: "full" | "refresh" = "full") => {
      if (mode === "full") setLoading(true);
      else setRefreshing(true);
      setLoadError(null);

      const reads = await loadReadIds();
      setReadIds(reads);

      let announcements: PassengerAnnouncement[] = [];
      try {
        const res = await listPassengerAnnouncements();
        announcements = res.items ?? [];
      } catch {
        setLoadError("Could not load service announcements. Pull to refresh.");
      }

      let bookings: MyBookingItem[] = [];
      try {
        bookings = await loadPassengerBookingsForTripsScreen();
      } catch {
        /* guest or Firestore unavailable */
      }

      let balance: number | null = null;
      try {
        const w = await getWallet();
        balance = typeof w.balance === "number" ? w.balance : null;
      } catch {
        /* not signed in or API error */
      }

      await mergeFeed(announcements, bookings, balance);

      if (mode === "full") setLoading(false);
      else setRefreshing(false);
    },
    [mergeFeed]
  );

  useEffect(() => {
    void load("full");
  }, [load]);

  const skipNextFocusRefresh = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefresh.current) {
        skipNextFocusRefresh.current = false;
        return;
      }
      void load("refresh");
    }, [load])
  );

  const filtered = useMemo(() => {
    return feedItems.filter((item) => {
      if (activeFilter === "All") return true;
      if (item.filterKey === "General") return false;
      return item.filterKey === activeFilter;
    });
  }, [feedItems, activeFilter]);

  const { todayItems, earlierItems } = useMemo(() => {
    const now = new Date();
    const today: FeedItem[] = [];
    const earlier: FeedItem[] = [];
    for (const item of filtered) {
      if (isSameLocalDay(item.createdAt, now)) today.push(item);
      else earlier.push(item);
    }
    return { todayItems: today, earlierItems: earlier };
  }, [filtered]);

  const toggleRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      void persistReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const x of feedItems) next.add(x.id);
      void persistReadIds(next);
      return next;
    });
  }, [feedItems]);

  const unreadCount = useMemo(
    () => feedItems.filter((x) => !readIds.has(x.id)).length,
    [feedItems, readIds]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load("refresh")}
              tintColor={colors.blueSoft}
              colors={[colors.blueSoft]}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.headerIconWrap}>
              <Ionicons name="flash-outline" size={18} color="#AFC4DD" />
              {unreadCount > 0 ? <View style={styles.unreadDot} /> : null}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filters.map((filter) => {
              const active = filter === activeFilter;
              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    active && styles.filterChipActive,
                    pressed && styles.filterPressed,
                  ]}
                >
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{filter}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {!loading && feedItems.length > 0 ? (
            <Pressable onPress={markAllRead} style={styles.markAllRow} hitSlop={8}>
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          ) : null}

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.blueSoft} />
              <Text style={styles.hint}>Loading your notifications…</Text>
            </View>
          ) : null}

          {!loading && loadError ? <Text style={styles.banner}>{loadError}</Text> : null}

          {!loading && filtered.length === 0 ? (
            <Text style={styles.empty}>
              No notifications in this category. Try another filter or pull to refresh.
            </Text>
          ) : null}

          {!loading && todayItems.length > 0 ? (
            <>
              <SectionHeader title="TODAY" />
              {todayItems.map((item) => (
                <NotificationCard
                  key={item.id}
                  title={item.title}
                  body={item.body}
                  time={formatNotificationTime(item.createdAt)}
                  type={item.important ? "important" : "default"}
                  icon={item.icon}
                  read={readIds.has(item.id)}
                  onPress={() => toggleRead(item.id)}
                  optionalActionLabel={item.optionalActionLabel}
                  onOptionalActionPress={item.onOptionalActionPress}
                />
              ))}
            </>
          ) : null}

          {!loading && earlierItems.length > 0 ? (
            <>
              <SectionHeader title="EARLIER" />
              {earlierItems.map((item) => (
                <NotificationCard
                  key={item.id}
                  title={item.title}
                  body={item.body}
                  time={formatNotificationTime(item.createdAt)}
                  type={item.important ? "important" : "default"}
                  icon={item.icon}
                  read={readIds.has(item.id)}
                  onPress={() => toggleRead(item.id)}
                  optionalActionLabel={item.optionalActionLabel}
                  onOptionalActionPress={item.onOptionalActionPress}
                />
              ))}
            </>
          ) : null}

          {!loading && feedItems.length > 0 && filtered.length > 0 ? (
            <View style={styles.endState}>
              <Ionicons name="notifications-outline" size={22} color="#8DA2BB" />
              <Text style={styles.endText}>You are all caught up for now.</Text>
            </View>
          ) : null}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: spacing.page, paddingBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "800" },
  headerIconWrap: { position: "relative", padding: 4 },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.blueSoft,
  },
  filterRow: {
    gap: 10,
    paddingBottom: 14,
    paddingRight: 6,
  },
  filterChip: {
    minHeight: 56,
    minWidth: 102,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E2F45",
    backgroundColor: "#101B2A",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    borderColor: "#2E5E9A",
    backgroundColor: "#173A67",
  },
  filterLabel: {
    color: "#AFBFD3",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  filterLabelActive: {
    color: "#EAF4FF",
  },
  filterPressed: { opacity: 0.85 },
  markAllRow: { alignSelf: "flex-end", marginBottom: 10 },
  markAllText: { color: colors.blueSoft, fontSize: 13, fontWeight: "700" },
  center: { paddingVertical: 20, alignItems: "center", gap: 8 },
  hint: { color: colors.textMuted, fontSize: 13 },
  banner: {
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
  empty: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  endState: { alignItems: "center", marginTop: 8, marginBottom: 8 },
  endText: { marginTop: 8, color: "#8EA1B8", fontSize: 12, textAlign: "center" },
});
