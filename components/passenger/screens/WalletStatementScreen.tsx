import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerWalletStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerWalletStackParamList, "WalletStatement">;

export default function WalletStatementScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Statement</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>October 2026</Text>
          <Text style={styles.cardMeta}>72 transactions</Text>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={styles.statValue}>$132.75</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Top-ups</Text>
            <Text style={styles.statValue}>$210.00</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Closing Balance</Text>
            <Text style={styles.statValue}>$428.50</Text>
          </View>
        </View>

        <Pressable style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={18} color="#031322" />
          <Text style={styles.downloadText}>Download PDF</Text>
        </Pressable>

        <Pressable style={styles.downloadBtnSecondary}>
          <Ionicons name="mail-outline" size={18} color="#CFE4F9" />
          <Text style={styles.downloadTextSecondary}>Email Statement</Text>
        </Pressable>
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
  card: { borderRadius: 14, borderWidth: 1, borderColor: "#23354A", backgroundColor: "#101A27", padding: 14, marginBottom: 16 },
  cardTitle: { color: "#EAF4FF", fontSize: 18, fontWeight: "800" },
  cardMeta: { color: "#8EA3BA", fontSize: 12, marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#2D415A", marginVertical: 10 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  statLabel: { color: "#B9CBE0", fontSize: 13 },
  statValue: { color: "#EAF4FF", fontSize: 14, fontWeight: "800" },
  downloadBtn: { height: 50, borderRadius: 12, backgroundColor: "#5EB3F6", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 },
  downloadText: { color: "#031322", fontSize: 15, fontWeight: "900" },
  downloadBtnSecondary: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: "#345678", backgroundColor: "#13253A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  downloadTextSecondary: { color: "#D8EBFF", fontSize: 15, fontWeight: "800" },
});
