import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerWalletStackParamList } from "../types";
import { transferWallet } from "../../../services/api/wallet";

type Props = NativeStackScreenProps<PassengerWalletStackParamList, "Transfer">;

const recipients = [
  { id: "r1", name: "John Smith", tag: "@jsmith", email: "passenger@smartbus.local", recent: "Used yesterday" },
  { id: "r2", name: "Campus Shuttle", tag: "@campus", email: "driver@smartbus.local", recent: "Used 3 days ago" },
  { id: "r3", name: "Family Wallet", tag: "@family", email: "passenger@smartbus.local", recent: "New recipient" },
];

export default function TransferScreen({ navigation }: Props) {
  const [selectedRecipient, setSelectedRecipient] = useState(recipients[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleTransfer() {
    const recipient = recipients.find((r) => r.id === selectedRecipient);
    if (!recipient) return;
    try {
      setSubmitting(true);
      await transferWallet(recipient.email, 25);
      setMessage(`Transfer sent to ${recipient.name}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Transfer</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Transfer Amount</Text>
          <Text style={styles.amountValue}>$25.00</Text>
          <Text style={styles.amountHint}>Fee: $0.00 | Instant delivery</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Recipient</Text>
        {recipients.map((recipient) => {
          const active = recipient.id === selectedRecipient;
          return (
            <Pressable
              key={recipient.id}
              style={[styles.recipientCard, active && styles.recipientCardActive]}
              onPress={() => setSelectedRecipient(recipient.id)}
            >
              <View style={styles.recipientLeft}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={18} color="#5EB3F6" />
                </View>
                <View>
                  <Text style={styles.recipientName}>{recipient.name}</Text>
                  <Text style={styles.recipientMeta}>
                    {recipient.tag} - {recipient.recent}
                  </Text>
                </View>
              </View>
              <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={18} color={active ? "#5EB3F6" : "#7E93AA"} />
            </Pressable>
          );
        })}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={styles.cta} onPress={handleTransfer} disabled={submitting}>
          <Ionicons name="send-outline" size={18} color="#031322" />
          <Text style={styles.ctaText}>{submitting ? "Sending..." : "Send Transfer"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  content: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800" },
  amountCard: { borderRadius: 16, borderWidth: 1, borderColor: "#23354A", backgroundColor: "#101A28", padding: 14, marginBottom: 16 },
  amountLabel: { color: "#9FB4CB", fontSize: 12, fontWeight: "700" },
  amountValue: { color: "#F1F8FF", fontSize: 34, fontWeight: "900", marginTop: 4 },
  amountHint: { color: "#8EA3BA", fontSize: 12, marginTop: 4 },
  sectionTitle: { color: "#DCE9F8", fontSize: 14, fontWeight: "800", marginBottom: 10 },
  recipientCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", padding: 12, marginBottom: 10 },
  recipientCardActive: { borderColor: "#4E93D1", backgroundColor: "#13253B" },
  recipientLeft: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#16283D", alignItems: "center", justifyContent: "center" },
  recipientName: { color: "#EAF4FF", fontSize: 14, fontWeight: "700" },
  recipientMeta: { color: "#8EA3BA", fontSize: 12, marginTop: 2 },
  cta: { marginTop: 18, height: 52, borderRadius: 12, backgroundColor: "#5EB3F6", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { color: "#031322", fontSize: 16, fontWeight: "900" },
  message: { color: "#D6E6F7", marginTop: 8, marginBottom: -6, fontSize: 12, fontWeight: "600" },
});
