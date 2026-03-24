import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList, PassengerRootStackParamList } from "../types";
import { NavigationProp } from "@react-navigation/native";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "HomeInsights">;

const insightRows = [
  { id: "i1", title: "Service Advisory: Line 15A", body: "Minor delays near Old Town due to maintenance.", action: "View updates", icon: "notifications-outline" as const },
  { id: "i2", title: "Low Balance Alert", body: "Balance below $10. Top up now for smooth travel.", action: "Top up wallet", icon: "wallet-outline" as const },
];

function goToWalletAddMoney(navigation: Props["navigation"]) {
  const root = navigation.getParent()?.getParent() as
    | NavigationProp<PassengerRootStackParamList>
    | undefined;
  root?.navigate("MainTabs", {
    screen: "Wallet",
    params: { screen: "AddMoney" },
  });
}

function goToAlertsTab(navigation: Props["navigation"]) {
  const root = navigation.getParent()?.getParent() as
    | NavigationProp<PassengerRootStackParamList>
    | undefined;
  root?.navigate("MainTabs", { screen: "Alerts" });
}

export default function HomeInsightsScreen({ navigation, route }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Travel Insights</Text>
          <View style={styles.iconBtn} />
        </View>

        {route.params?.focus ? (
          <View style={styles.focusBanner}>
            <Text style={styles.focusText}>Focused view: {route.params.focus.toUpperCase()}</Text>
          </View>
        ) : null}

        {insightRows.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={16} color="#D6EAFE" />
            </View>
            <View style={styles.center}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
            <Pressable
              onPress={() =>
                  item.id === "i2" ? goToWalletAddMoney(navigation) : goToAlertsTab(navigation)
              }
            >
              <Text style={styles.action}>{item.action}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  content: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800" },
  focusBanner: { borderRadius: 10, borderWidth: 1, borderColor: "#2B4664", backgroundColor: "#13253B", paddingHorizontal: 10, paddingVertical: 8, marginBottom: 12 },
  focusText: { color: "#CFE4F9", fontSize: 12, fontWeight: "700" },
  card: { borderRadius: 14, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#183651", alignItems: "center", justifyContent: "center" },
  center: { flex: 1 },
  cardTitle: { color: "#EAF4FF", fontSize: 15, fontWeight: "800" },
  cardBody: { color: "#8EA3BA", fontSize: 12, marginTop: 4 },
  action: { color: "#60A5FA", fontSize: 12, fontWeight: "700", marginTop: 2 },
});
