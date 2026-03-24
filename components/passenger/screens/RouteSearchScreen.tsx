import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PassengerHomeStackParamList, PassengerRootStackParamList } from "../types";
import { colors } from "../theme";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "RouteSearch">;

export default function RouteSearchScreen({ navigation }: Props) {
  const [from, setFrom] = useState("Central Terminal, Downtown");
  const [to, setTo] = useState("Destination City");
  const [selectedDate, setSelectedDate] = useState("TODAY");
  const [selectedPref, setSelectedPref] = useState("AC");

  const navigateRoot = (screen: "CalendarPicker" | "RouteOptions") => {
    const root = navigation.getParent()?.getParent() as
      | NavigationProp<PassengerRootStackParamList>
      | undefined;
    root?.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <View style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#D6E7F7" />
              </Pressable>
              <Text style={styles.title}>Find a Bus</Text>
              <Pressable onPress={() => navigateRoot("RouteOptions")}>
                <Ionicons name="options-outline" size={18} color="#A4B9CE" />
              </Pressable>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.sectionHeading}>Where to?</Text>
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark" size={11} color="#93E9A3" />
                <Text style={styles.verifiedPillText}>Verified Routes</Text>
              </View>
            </View>

            <View style={styles.inputStack}>
              <Input value={from} onChangeText={setFrom} icon="location-outline" />
              <Input value={to} onChangeText={setTo} icon="location-outline" danger />
              <Pressable
                style={styles.swapBtn}
                onPress={() => {
                  const currentFrom = from;
                  setFrom(to);
                  setTo(currentFrom);
                }}
              >
                <Ionicons name="swap-vertical-outline" size={14} color="#5EA1E6" />
              </Pressable>
            </View>

            <View style={styles.blockHeader}>
              <View style={styles.rowCenter}>
                <Ionicons name="calendar-outline" size={14} color="#A7BCD1" />
                <Text style={styles.blockTitle}>Travel Date</Text>
              </View>
              <Pressable onPress={() => navigateRoot("CalendarPicker")}>
                <Text style={styles.calendarText}>View Calendar</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {[
                { key: "TODAY", day: "24", mon: "Oct" },
                { key: "TOMORROW", day: "25", mon: "Oct" },
                { key: "SUN", day: "26", mon: "Oct" },
                { key: "MON", day: "27", mon: "Oct" },
                { key: "TUE", day: "28", mon: "Oct" },
              ].map((item) => {
                const active = selectedDate === item.key;
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    onPress={() => setSelectedDate(item.key)}
                  >
                    <Text style={[styles.dateChipTop, active && styles.dateChipTopActive]}>{item.key}</Text>
                    <Text style={[styles.dateChipDay, active && styles.dateChipDayActive]}>{item.day}</Text>
                    <Text style={[styles.dateChipMon, active && styles.dateChipMonActive]}>{item.mon}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>PREFERENCES</Text>
            <View style={styles.prefRow}>
              <PrefItem
                icon="snow-outline"
                label="AC"
                active={selectedPref === "AC"}
                onPress={() => setSelectedPref("AC")}
              />
              <PrefItem
                icon="time-outline"
                label="Sleeper"
                active={selectedPref === "Sleeper"}
                onPress={() => setSelectedPref("Sleeper")}
              />
              <PrefItem
                icon="flash-outline"
                label="Direct"
                active={selectedPref === "Direct"}
                onPress={() => setSelectedPref("Direct")}
              />
            </View>

            <Text style={styles.sectionLabel}>RECENT ROUTES</Text>
            <View style={styles.recentWrap}>
              <RecentRoute title="Central -> East Side" subtitle="Last searched 2h ago" amount="$12" />
              <RecentRoute title="Airport -> City Mall" subtitle="Last searched 2h ago" amount="$25" />
            </View>

            <Pressable
              style={styles.button}
              onPress={() =>
                navigation.navigate("AvailableBuses", {
                  from,
                  to,
                })
              }
            >
              <Ionicons name="search-outline" size={18} color="#0A1A2B" />
              <Text style={styles.buttonText}>Search Buses</Text>
            </Pressable>
            <Text style={styles.footerHint}>Search across 40+ transit partners in real-time</Text>
          </ScrollView>

        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function Input({
  value,
  onChangeText,
  icon,
  danger,
}: {
  value: string;
  onChangeText: (text: string) => void;
  icon: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={16} color={danger ? "#D46363" : "#4877AA"} />
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor="#7C93AE" />
    </View>
  );
}

function PrefItem({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.prefChip, active && styles.prefChipActive]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={active ? "#D8EAFE" : "#8DA4BD"} />
      <Text style={[styles.prefText, active && styles.prefTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RecentRoute({ title, subtitle, amount }: { title: string; subtitle: string; amount: string }) {
  return (
    <View style={styles.recentRow}>
      <View style={styles.rowCenter}>
        <View style={styles.clockIcon}>
          <Ionicons name="time-outline" size={13} color="#9CB3CC" />
        </View>
        <View>
          <Text style={styles.recentTitle}>{title}</Text>
          <Text style={styles.recentSub}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.amountPill}>
        <Text style={styles.amountText}>{amount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  headerRow: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#172332",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { color: "#E6F1FC", fontSize: 18, fontWeight: "800" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionHeading: { color: "#E9F3FE", fontSize: 32, fontWeight: "900" },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#124028",
    borderWidth: 1,
    borderColor: "#1A5B39",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  verifiedPillText: { color: "#C0F0CB", fontSize: 11, fontWeight: "800" },
  inputStack: {
    marginBottom: 16,
    position: "relative",
    gap: 10,
  },
  inputWrap: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E2E42",
    backgroundColor: "#101A28",
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, color: "#DFECF9", fontSize: 16, fontWeight: "700" },
  swapBtn: {
    position: "absolute",
    right: 12,
    top: 37,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#142133",
    borderWidth: 1,
    borderColor: "#213247",
    alignItems: "center",
    justifyContent: "center",
  },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  blockHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  blockTitle: { color: "#D3DFED", fontSize: 15, fontWeight: "800" },
  calendarText: { color: "#6FA4E7", fontSize: 12, fontWeight: "700" },
  chipRow: { gap: 8, paddingRight: 8, marginBottom: 18 },
  dateChip: {
    width: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24384D",
    backgroundColor: "#121E2B",
    alignItems: "center",
    paddingVertical: 9,
  },
  dateChipActive: { backgroundColor: "#4E93D1", borderColor: "#4E93D1" },
  dateChipTop: { color: "#9FB5CC", fontSize: 10, fontWeight: "800" },
  dateChipTopActive: { color: "#10243C" },
  dateChipDay: { color: "#EEF6FE", fontSize: 20, fontWeight: "900", lineHeight: 23, marginVertical: 2 },
  dateChipDayActive: { color: "#10243C" },
  dateChipMon: { color: "#A8BED5", fontSize: 11, fontWeight: "700" },
  dateChipMonActive: { color: "#10243C" },
  sectionLabel: { color: "#C6D5E6", fontSize: 15, fontWeight: "900", marginBottom: 10, letterSpacing: 0.6 },
  prefRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  prefChip: {
    flex: 1,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#24384B",
    backgroundColor: "#111C2A",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  prefChipActive: { backgroundColor: "#15283D", borderColor: "#335678" },
  prefText: { color: "#B8CADE", fontSize: 13, fontWeight: "800" },
  prefTextActive: { color: "#DDEBFA" },
  recentWrap: { gap: 10, marginBottom: 18 },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#111C2A",
    borderWidth: 1,
    borderColor: "#1E3146",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  clockIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0E1623",
    borderWidth: 1,
    borderColor: "#1E2D3F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },
  recentTitle: { color: "#EAF3FF", fontSize: 17, fontWeight: "800" },
  recentSub: { color: "#98AEC7", fontSize: 12, marginTop: 2 },
  amountPill: { backgroundColor: "#10253D", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 4 },
  amountText: { color: "#7EB5F6", fontSize: 13, fontWeight: "800" },
  button: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#5B9FE2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  buttonText: { color: "#081A2D", fontWeight: "900", fontSize: 18 },
  footerHint: { color: "#8AA1B9", textAlign: "center", fontSize: 12, marginTop: 10, marginBottom: 8 },
});
