import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "ExpressRoutes">;

const expressRoutes = [
  { id: "e1", route: "402 Express", from: "Central", to: "North Hub", duration: "18 min" },
  { id: "e2", route: "19A Airport", from: "Downtown", to: "Airport", duration: "26 min" },
  { id: "e3", route: "10B Rapid", from: "West End", to: "Old Town", duration: "22 min" },
];

export default function ExpressRoutesScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Express Routes</Text>
          <View style={styles.iconBtn} />
        </View>

        {expressRoutes.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.routeName}>{item.route}</Text>
            <Text style={styles.meta}>{item.from + " to " + item.to}</Text>
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={12} color="#B9D9F8" />
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
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
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2E4E6E",
    backgroundColor: "#10253D",
    padding: 14,
    marginBottom: 10,
  },
  routeName: { color: "#EAF4FF", fontSize: 17, fontWeight: "800" },
  meta: { color: "#A8C2DE", fontSize: 12, marginTop: 4 },
  durationPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3D6186",
    backgroundColor: "#18334F",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: { color: "#D5E9FD", fontSize: 11, fontWeight: "700" },
});
