import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerRootStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "CalendarPicker">;

const dates = ["24 Oct", "25 Oct", "26 Oct", "27 Oct", "28 Oct", "29 Oct"] as const;

export default function CalendarPickerScreen({ navigation }: Props) {
  const [selected, setSelected] = useState("24 Oct");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Pick Travel Date</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.grid}>
          {dates.map((date) => {
            const active = selected === date;
            return (
              <Pressable key={date} style={[styles.dateItem, active && styles.dateItemActive]} onPress={() => setSelected(date)}>
                <Text style={[styles.dateText, active && styles.dateTextActive]}>{date}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.confirmBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.confirmText}>Use {selected}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  content: { flex: 1, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dateItem: { width: "47%", borderRadius: 12, borderWidth: 1, borderColor: "#25374C", backgroundColor: "#111B29", alignItems: "center", justifyContent: "center", height: 56 },
  dateItemActive: { borderColor: "#5EB3F6", backgroundColor: "#173A67" },
  dateText: { color: "#D6E6F7", fontSize: 14, fontWeight: "700" },
  dateTextActive: { color: "#EAF4FF" },
  confirmBtn: { marginTop: 16, height: 50, borderRadius: 12, backgroundColor: "#5EB3F6", alignItems: "center", justifyContent: "center" },
  confirmText: { color: "#041120", fontSize: 15, fontWeight: "900" },
});
