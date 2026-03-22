import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PassengerRootStackParamList } from "../types";

const BG = "#121212";
const MAP_SURFACE = "#1A1C1E";
const BORDER = "#2C2C2E";
const TEXT = "#FFFFFF";
const SOS_RED = "#E53935";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "LiveTracking">;

export default function LiveTrackingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={14} style={styles.headerSide}>
            <Ionicons name="chevron-back" size={24} color={TEXT} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Live Tracking
          </Text>
          <Pressable
            hitSlop={12}
            style={styles.sosBtn}
            onPress={() => {
              /* SOS / emergency flow */
            }}
            accessibilityLabel="Emergency or SOS"
          >
            <View style={styles.sosShield}>
              <Text style={styles.sosBangText}>!</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {/* Drop-in react-native-maps / Mapbox MapView here */}
        <View style={styles.mapArea} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 48,
  },
  headerSide: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 8,
  },
  sosBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  sosShield: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: SOS_RED,
    alignItems: "center",
    justifyContent: "center",
  },
  sosBangText: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
    marginTop: -2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BORDER,
  },
  mapArea: {
    flex: 1,
    backgroundColor: MAP_SURFACE,
  },
});
