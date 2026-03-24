import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "NearestStops">;

const stops = [
  { id: "s1", name: "Central Terminal", distance: "220m", routes: "402, 510, 225" },
  { id: "s2", name: "Old Town Junction", distance: "480m", routes: "15A, 29, 310" },
  { id: "s3", name: "City Hall", distance: "670m", routes: "19A, 10B, 12" },
];

export default function NearestStopsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Nearest Stops</Text>
          <View style={styles.iconBtn} />
        </View>

        {stops.map((stop) => (
          <View key={stop.id} style={styles.stopCard}>
            <View style={styles.top}>
              <Text style={styles.stopName}>{stop.name}</Text>
              <Text style={styles.distance}>{stop.distance}</Text>
            </View>
            <Text style={styles.routes}>Routes: {stop.routes}</Text>
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
  stopCard: { borderRadius: 14, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", padding: 14, marginBottom: 10 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stopName: { color: "#EAF4FF", fontSize: 16, fontWeight: "800" },
  distance: { color: "#5EB3F6", fontSize: 13, fontWeight: "800" },
  routes: { color: "#8EA3BA", fontSize: 12, marginTop: 5 },
});
