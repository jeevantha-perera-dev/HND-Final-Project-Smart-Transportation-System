import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerWalletStackParamList } from "../types";
import { getWalletHistory } from "../../../services/api/wallet";

type Props = NativeStackScreenProps<PassengerWalletStackParamList, "WalletHistory">;

const rows = [
  { id: "h1", title: "Route 42 - Downtown", time: "Today, 09:45 AM", amount: "-$2.50", tone: "#5EB3F6" },
  { id: "h2", title: "Wallet Top-up", time: "Yesterday, 04:12 PM", amount: "+$50.00", tone: "#34C759" },
  { id: "h3", title: "Transfer to J.Smith", time: "Mon, 20 Oct", amount: "-$12.00", tone: "#FF9F0A" },
  { id: "h4", title: "Monthly Reward", time: "Mon, 18 Oct", amount: "+$5.00", tone: "#5EB3F6" },
];

export default function WalletHistoryScreen({ navigation }: Props) {
  const [historyRows, setHistoryRows] = useState(rows);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getWalletHistory();
        if (!mounted) return;
        setHistoryRows(
          result.items.map((item, idx) => ({
            id: item.id ?? `h-${idx}`,
            title: item.reference ?? "Wallet transaction",
            time: new Date(item.createdAt ?? Date.now()).toLocaleString(),
            amount: Number(item.amount) >= 0 ? `+$${Number(item.amount).toFixed(2)}` : `-$${Math.abs(Number(item.amount)).toFixed(2)}`,
            tone: Number(item.amount) >= 0 ? "#34C759" : "#5EB3F6",
          }))
        );
      } catch {
        // keep static fallback
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Wallet History</Text>
          <View style={styles.iconBtn} />
        </View>

        {historyRows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: row.tone }]} />
            <View style={styles.rowCenter}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowTime}>{row.time}</Text>
            </View>
            <Text style={styles.rowAmount}>{row.amount}</Text>
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
  row: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  rowCenter: { flex: 1 },
  rowTitle: { color: "#EAF4FF", fontSize: 14, fontWeight: "700" },
  rowTime: { color: "#8EA3BA", fontSize: 12, marginTop: 2 },
  rowAmount: { color: "#DCEBFA", fontSize: 14, fontWeight: "800" },
});
