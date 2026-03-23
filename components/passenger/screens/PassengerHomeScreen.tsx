import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList, PassengerRootStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "HomeMain">;

function navigateRootLiveTracking(navigation: Props["navigation"]) {
  const root = navigation.getParent()?.getParent() as
    | NavigationProp<PassengerRootStackParamList>
    | undefined;
  root?.navigate("LiveTracking");
}

const nearBuses = [
  { id: "402", title: "402 Express", destination: "to Central Station", arriving: "4 mins", seats: "12 seats available", crowd: "Low Crowd" },
  { id: "510", title: "Blue Line", destination: "to North Hub", arriving: "9 mins", seats: "5 seats available", crowd: "Medium" },
];

const insights = [
  {
    id: "insight-1",
    title: "Service Advisory: Line 15A",
    body: "Expect minor delays near Old Town due to road maintenance.",
    action: "Updates",
    icon: "notifications-outline" as const,
    tint: "#2C6CB0",
  },
  {
    id: "insight-2",
    title: "Low Balance Alert",
    body: "Your wallet is below $10. Top up now for uninterrupted travel.",
    action: "Top Up",
    icon: "wallet-outline" as const,
    tint: "#1C8A53",
  },
];

const quickActions = [
  { id: "nearest", label: "Nearest Stop", icon: "navigate-circle-outline" as const, color: "#17589D" },
  { id: "favorites", label: "Favorites", icon: "star-outline" as const, color: "#8A5A14" },
  { id: "express", label: "Express", icon: "flash-outline" as const, color: "#6A34A0" },
  { id: "nearby", label: "Nearby", icon: "paper-plane-outline" as const, color: "#1E8D47" },
];

export default function PassengerHomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#0A121E", "#071221", "#081019"]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Ionicons name="bus-outline" size={16} color="#0A192A" />
              </View>
              <Text style={styles.brandText}>TransitFlow</Text>
            </View>
            <Pressable style={styles.notifyBtn}>
              <Ionicons name="notifications-outline" size={20} color="#DEEAF8" />
            </Pressable>
          </View>

          <View style={styles.heroWrap}>
            <Pressable style={styles.searchCard} onPress={() => navigation.navigate("RouteSearch")}>
              <View style={styles.searchIcon}>
                <Ionicons name="search-outline" size={20} color="#62AFFF" />
              </View>
              <View style={styles.searchTextWrap}>
                <Text style={styles.searchTitle}>Where are you going?</Text>
                <Text style={styles.searchBody}>Search by route or destination</Text>
              </View>
              <View style={styles.arrowCircle}>
                <Ionicons name="paper-plane-outline" size={16} color="#9FB3C9" />
              </View>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Buses Near You</Text>
              <Pressable>
                <Text style={styles.sectionAction}>View All</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.busRow}>
              {nearBuses.map((bus) => (
                <Pressable key={bus.id} style={styles.busCard} onPress={() => navigateRootLiveTracking(navigation)}>
                  <View style={styles.busTop}>
                    <View style={styles.busBadge}>
                      <Ionicons name="bus-outline" size={12} color="#74B5F7" />
                    </View>
                    <Text style={styles.busTitle}>{bus.title}</Text>
                  </View>
                  <Text style={styles.busDestination}>{bus.destination}</Text>
                  <View style={styles.busDivider} />
                  <View style={styles.busMetaRow}>
                    <View>
                      <Text style={styles.metaLabel}>ARRIVING IN</Text>
                      <Text style={styles.metaValue}>{bus.arriving}</Text>
                    </View>
                    <View>
                      <Text style={styles.metaLabel}>STATUS</Text>
                      <Text style={styles.metaValue}>{bus.crowd}</Text>
                    </View>
                  </View>
                  <View style={styles.seatPill}>
                    <Ionicons name="people-outline" size={13} color="#B4CBE1" />
                    <Text style={styles.seatText}>{bus.seats}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.quickActionsWrap}>
            {quickActions.map((item) => (
              <Pressable key={item.id} style={styles.quickAction}>
                <View style={[styles.quickIcon, { backgroundColor: item.color }]}>
                  <Ionicons name={item.icon} size={18} color="#DCEBFA" />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>Travel Insights</Text>
            <Pressable style={styles.updatesChip}>
              <Text style={styles.updatesText}>Updates</Text>
            </Pressable>
          </View>

          {insights.map((item) => (
            <View key={item.id} style={styles.insightCard}>
              <View style={[styles.insightIconWrap, { backgroundColor: item.tint }]}>
                <Ionicons name={item.icon} size={16} color="#EAF4FF" />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightCardTitle}>{item.title}</Text>
                <Text style={styles.insightCardBody}>{item.body}</Text>
              </View>
              <Pressable>
                <Text style={styles.insightAction}>{item.action}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050B14" },
  gradient: { flex: 1 },
  content: { paddingHorizontal: 14, paddingBottom: 18 },
  topBar: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F7FBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { color: "#F0F7FF", fontSize: 31, fontWeight: "800" },
  notifyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#121B27",
    borderWidth: 1,
    borderColor: "#1D2B3C",
    alignItems: "center",
    justifyContent: "center",
  },
  heroWrap: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: "rgba(31,38,48,0.5)",
    borderWidth: 1,
    borderColor: "#2A3645",
    padding: 10,
  },
  searchCard: {
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: "#131D2A",
    borderWidth: 1,
    borderColor: "#253244",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#15314F",
    alignItems: "center",
    justifyContent: "center",
  },
  searchTextWrap: { flex: 1, marginLeft: 10 },
  searchTitle: { color: "#F2F8FF", fontSize: 17, fontWeight: "800" },
  searchBody: { color: "#B3C4D6", fontSize: 13, marginTop: 2, fontWeight: "600" },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#2C3B4F",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F1824",
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: "#F1F8FF", fontSize: 16, fontWeight: "800" },
  sectionAction: { color: "#AFC1D7", fontSize: 14, fontWeight: "700" },
  busRow: { gap: 10, paddingRight: 4 },
  busCard: {
    width: 286,
    borderRadius: 14,
    backgroundColor: "#101A27",
    borderWidth: 1,
    borderColor: "#243446",
    padding: 12,
  },
  busTop: { flexDirection: "row", alignItems: "center" },
  busBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#173A62",
    alignItems: "center",
    justifyContent: "center",
  },
  busTitle: { color: "#F2F8FF", fontSize: 35, fontWeight: "800", marginLeft: 9 },
  busDestination: { color: "#EAF3FD", fontSize: 33, fontWeight: "600", marginTop: 2 },
  busDivider: { height: 1, backgroundColor: "#27384A", marginTop: 9, marginBottom: 9 },
  busMetaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  metaLabel: { color: "#9FB4CA", fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  metaValue: { color: "#EAF4FF", fontSize: 21, fontWeight: "800", marginTop: 2 },
  seatPill: {
    height: 30,
    borderRadius: 8,
    backgroundColor: "#192532",
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    gap: 6,
  },
  seatText: { color: "#C8D8E8", fontSize: 13, fontWeight: "700" },
  quickActionsWrap: {
    marginTop: 12,
    borderRadius: 26,
    backgroundColor: "#121B27",
    borderWidth: 1,
    borderColor: "#1F2D3D",
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickAction: { width: "24%", alignItems: "center" },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    marginTop: 8,
    color: "#E4EEF8",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  insightHeader: {
    marginTop: 14,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightTitle: { color: "#F0F7FF", fontSize: 20, fontWeight: "800" },
  updatesChip: {
    borderRadius: 999,
    backgroundColor: "#30455C",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  updatesText: { color: "#D7E8F9", fontSize: 12, fontWeight: "700" },
  insightCard: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#253649",
    backgroundColor: "#151F2B",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  insightIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  insightContent: { flex: 1 },
  insightCardTitle: { color: "#F2F8FF", fontSize: 23, fontWeight: "800" },
  insightCardBody: { color: "#C7D8E9", fontSize: 11, lineHeight: 15, marginTop: 2, fontWeight: "600" },
  insightAction: { color: "#61A8ED", fontSize: 12, fontWeight: "800", marginTop: 1 },
});
