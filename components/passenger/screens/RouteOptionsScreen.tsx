import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerRootStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "RouteOptions">;

const options = ["Fastest", "Cheapest", "Least Walking", "Accessible"] as const;

export default function RouteOptionsScreen({ navigation }: Props) {
  const [selected, setSelected] = useState("Fastest");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Route Options</Text>
          <View style={styles.iconBtn} />
        </View>

        {options.map((option) => {
          const active = selected === option;
          return (
            <Pressable key={option} style={[styles.optionCard, active && styles.optionCardActive]} onPress={() => setSelected(option)}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
              <Ionicons name={active ? "checkmark-circle" : "ellipse-outline"} size={18} color={active ? "#5EB3F6" : "#7E93AA"} />
            </Pressable>
          );
        })}

        <Pressable style={styles.applyBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.applyText}>Apply Filters</Text>
        </Pressable>
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
  optionCard: { borderRadius: 12, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", paddingHorizontal: 12, height: 52, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionCardActive: { borderColor: "#4E93D1", backgroundColor: "#13253B" },
  optionText: { color: "#D6E6F7", fontSize: 14, fontWeight: "700" },
  optionTextActive: { color: "#EAF4FF" },
  applyBtn: { marginTop: 10, height: 50, borderRadius: 12, backgroundColor: "#5EB3F6", alignItems: "center", justifyContent: "center" },
  applyText: { color: "#041120", fontSize: 15, fontWeight: "900" },
});
