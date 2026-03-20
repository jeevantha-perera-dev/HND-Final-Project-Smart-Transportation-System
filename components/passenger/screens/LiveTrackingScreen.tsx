import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme";
import PassengerBottomNav from "../PassengerBottomNav";

export default function LiveTrackingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <View style={styles.center}>
          <Text style={styles.title}>Bus Live Tracking</Text>
        </View>
        <PassengerBottomNav active="Trips" />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#E8F2FF", fontSize: 24, fontWeight: "800" },
});
