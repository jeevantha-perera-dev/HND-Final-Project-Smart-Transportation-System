import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#0A1526", "#05090F"]} style={styles.gradient}>
        <View style={styles.container}>
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Top up and payment methods will appear here.</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  gradient: { flex: 1 },
  container: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  title: { color: "#EAF4FF", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#9FB3C8", fontSize: 14, textAlign: "center", marginTop: 6 },
});
