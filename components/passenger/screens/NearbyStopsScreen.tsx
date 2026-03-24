import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "NearbyStops">;

const nearby = [
  { id: "n1", name: "Main Street Stop", walk: "3 min walk", lines: "402, 12, 15A" },
  { id: "n2", name: "Library Junction", walk: "5 min walk", lines: "510, 19A" },
  { id: "n3", name: "Riverfront Park", walk: "7 min walk", lines: "225, 29" },
];

export default function NearbyStopsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Nearby Stops</Text>
          <View style={styles.iconBtn} />
        </View>

        {nearby.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.nameRow}>
              <Ionicons name="location-outline" size={15} color="#5EB3F6" />
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.walk}>{item.walk}</Text>
            <Text style={styles.lines}>{item.lines}</Text>
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: "#EAF4FF", fontSize: 16, fontWeight: "800" },
  walk: { color: "#8EA3BA", fontSize: 12, marginTop: 4 },
  lines: { color: "#5EB3F6", fontSize: 13, fontWeight: "700", marginTop: 8 },
});
