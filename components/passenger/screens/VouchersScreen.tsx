import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerWalletStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerWalletStackParamList, "Vouchers">;

const vouchers = [
  { id: "v1", title: "10% Off Weekend Trips", code: "WEEKEND10", expiry: "Expires in 4 days", tone: "#5EB3F6" },
  { id: "v2", title: "$5 Cashback", code: "CASH5", expiry: "Expires in 9 days", tone: "#34C759" },
  { id: "v3", title: "Student Priority Pass", code: "STUDENTPASS", expiry: "Expires in 14 days", tone: "#FF9F0A" },
];

export default function VouchersScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Vouchers</Text>
          <View style={styles.iconBtn} />
        </View>

        <Text style={styles.subtitle}>Use your active offers during checkout.</Text>

        {vouchers.map((voucher) => (
          <View key={voucher.id} style={styles.card}>
            <View style={[styles.badge, { backgroundColor: voucher.tone }]}>
              <Ionicons name="pricetag-outline" size={14} color="#031322" />
              <Text style={styles.badgeText}>ACTIVE</Text>
            </View>
            <Text style={styles.cardTitle}>{voucher.title}</Text>
            <Text style={styles.cardCode}>{voucher.code}</Text>
            <Text style={styles.cardMeta}>{voucher.expiry}</Text>
            <Pressable style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>Apply Voucher</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800" },
  subtitle: { color: "#8EA3BA", fontSize: 13, marginBottom: 14 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: "#24364A", backgroundColor: "#101A27", padding: 14, marginBottom: 12 },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { color: "#031322", fontSize: 10, fontWeight: "900" },
  cardTitle: { color: "#EEF6FF", fontSize: 17, fontWeight: "800", marginTop: 10 },
  cardCode: { color: "#5EB3F6", fontSize: 14, fontWeight: "800", marginTop: 4 },
  cardMeta: { color: "#8EA3BA", fontSize: 12, marginTop: 3 },
  applyBtn: { marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: "#2F4D6D", backgroundColor: "#13253A", height: 40, alignItems: "center", justifyContent: "center" },
  applyBtnText: { color: "#D8EBFF", fontSize: 13, fontWeight: "800" },
});
