import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerWalletStackParamList } from "../types";
import { ApiError } from "../../../services/api/client";
import { getWallet, topupWallet } from "../../../services/api/wallet";

type Props = NativeStackScreenProps<PassengerWalletStackParamList, "AddMoney">;

const QUICK_AMOUNTS = [10, 25, 50, 100, 500, 1000] as const;

export default function AddMoneyScreen({ navigation }: Props) {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoaded, setBalanceLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const wallet = await getWallet();
        if (!mounted) return;
        setBalance(wallet.balance);
        setLoadError(null);
      } catch (e) {
        if (!mounted) return;
        setBalance(null);
        setLoadError(e instanceof ApiError ? e.message : "Could not load wallet balance.");
      } finally {
        if (mounted) setBalanceLoaded(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleTopup() {
    try {
      setSubmitting(true);
      setMessage(null);
      const result = await topupWallet(selectedAmount);
      setBalance(result.balance);
      setLoadError(null);
      setMessage(`Top-up successful. New balance: LKR ${result.balance.toFixed(2)}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Top-up failed");
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
          <Text style={styles.title}>Add Money</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceValue}>
            {!balanceLoaded ? "Loading…" : loadError ? "—" : `LKR ${(balance ?? 0).toFixed(2)}`}
          </Text>
          {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
          <Text style={styles.balanceHint}>Balance is stored on your account (Firebase). Top-ups update instantly.</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Amount</Text>
        <View style={styles.amountGrid}>
          {QUICK_AMOUNTS.map((amount) => {
            const active = amount === selectedAmount;
            return (
              <Pressable
                key={amount}
                style={[styles.amountChip, active && styles.amountChipActive]}
                onPress={() => setSelectedAmount(amount)}
              >
                <Text style={[styles.amountText, active && styles.amountTextActive]}>
                  LKR {amount.toLocaleString()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Payment Method</Text>
        <View style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIcon}>
              <Ionicons name="card-outline" size={18} color="#5EB3F6" />
            </View>
            <View>
              <Text style={styles.methodName}>Visa ending in 2451</Text>
              <Text style={styles.methodMeta}>Primary card</Text>
            </View>
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#34C759" />
        </View>

        <View style={styles.methodCard}>
          <View style={styles.methodLeft}>
            <View style={styles.methodIcon}>
              <Ionicons name="wallet-outline" size={18} color="#5EB3F6" />
            </View>
            <View>
              <Text style={styles.methodName}>TransitFlow Pay</Text>
              <Text style={styles.methodMeta}>No processing fee</Text>
            </View>
          </View>
          <Ionicons name="ellipse-outline" size={20} color="#7E93AA" />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Pressable style={styles.cta} onPress={handleTopup} disabled={submitting}>
          <Ionicons name="add-circle-outline" size={18} color="#041120" />
          <Text style={styles.ctaText}>
            {submitting ? "Processing…" : `Add LKR ${selectedAmount.toFixed(0)}`}
          </Text>
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
  balanceCard: { backgroundColor: "#121C2A", borderRadius: 16, borderWidth: 1, borderColor: "#223246", padding: 14, marginBottom: 18 },
  balanceLabel: { color: "#9FB4CB", fontSize: 12, fontWeight: "700" },
  balanceValue: { color: "#F1F8FF", fontSize: 32, fontWeight: "900", marginTop: 4 },
  balanceHint: { color: "#8EA3BA", fontSize: 12, marginTop: 4 },
  loadError: { color: "#FF8A8A", fontSize: 12, fontWeight: "600", marginTop: 6 },
  sectionTitle: { color: "#DCE9F8", fontSize: 14, fontWeight: "800", marginBottom: 10, marginTop: 4 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  amountChip: { width: "47%", borderRadius: 12, backgroundColor: "#121D2B", borderWidth: 1, borderColor: "#25374C", paddingVertical: 16, alignItems: "center" },
  amountChipActive: { backgroundColor: "#5EB3F6", borderColor: "#5EB3F6" },
  amountText: { color: "#D6E6F7", fontSize: 18, fontWeight: "800" },
  amountTextActive: { color: "#0B1E32" },
  methodCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 12, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", padding: 12, marginBottom: 10 },
  methodLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  methodIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#16283D", alignItems: "center", justifyContent: "center" },
  methodName: { color: "#EAF4FF", fontSize: 14, fontWeight: "700" },
  methodMeta: { color: "#8EA3BA", fontSize: 12, marginTop: 2 },
  cta: { marginTop: 18, height: 52, borderRadius: 12, backgroundColor: "#5EB3F6", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { color: "#031322", fontSize: 16, fontWeight: "900" },
  message: { color: "#D6E6F7", marginTop: 8, marginBottom: -6, fontSize: 12, fontWeight: "600" },
});
