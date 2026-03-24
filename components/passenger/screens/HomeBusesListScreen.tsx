import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "HomeBusesList">;

const buses = [
  { id: "402", route: "402 Express", eta: "4 mins", crowd: "Low crowd" },
  { id: "510", route: "Blue Line", eta: "9 mins", crowd: "Medium crowd" },
  { id: "225", route: "City Loop", eta: "12 mins", crowd: "Low crowd" },
  { id: "19A", route: "Airport Shuttle", eta: "18 mins", crowd: "High crowd" },
];

export default function HomeBusesListScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Buses Near You</Text>
          <View style={styles.iconBtn} />
        </View>

        {buses.map((bus) => (
          <View key={bus.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.route}>{bus.route}</Text>
              <Text style={styles.eta}>{bus.eta}</Text>
            </View>
            <Text style={styles.meta}>{bus.crowd}</Text>
            <Pressable style={styles.cta} onPress={() => navigation.navigate("AvailableBuses")}>
              <Text style={styles.ctaText}>View Route Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#D9EBFF" />
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
  card: { borderRadius: 14, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  route: { color: "#EAF4FF", fontSize: 17, fontWeight: "800" },
  eta: { color: "#5EB3F6", fontSize: 13, fontWeight: "800" },
  meta: { color: "#8EA3BA", fontSize: 12, marginTop: 4 },
  cta: { marginTop: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5 },
  ctaText: { color: "#CFE4F9", fontSize: 12, fontWeight: "700" },
});
