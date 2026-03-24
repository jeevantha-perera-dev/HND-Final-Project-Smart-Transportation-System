import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerRootStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "CalendarPicker">;

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

function fromDateKey(value?: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export default function CalendarPickerScreen({ navigation, route }: Props) {
  const { width } = useWindowDimensions();
  const initialDate = useMemo(() => fromDateKey(route.params?.selectedDate) ?? new Date(), [route.params?.selectedDate]);
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(initialDate));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const calendarWidth = useMemo(() => Math.max(280, width - 20), [width]);
  const cellWidth = useMemo(() => Math.floor(calendarWidth / 7), [calendarWidth]);
  const gridWidth = useMemo(() => cellWidth * 7, [cellWidth]);

  const today = useMemo(() => new Date(), []);
  const monthLabel = useMemo(
    () => visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [visibleMonth]
  );

  const days = useMemo(() => {
    const firstDay = startOfMonth(visibleMonth);
    const firstWeekday = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstWeekday);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const inCurrentMonth = date.getMonth() === visibleMonth.getMonth();
      return { date, inCurrentMonth };
    });
  }, [visibleMonth]);

  function handleConfirm() {
    navigation.navigate("MainTabs", {
      screen: "Home",
      params: {
        screen: "RouteSearch",
        params: { selectedDate: toDateKey(selectedDate) },
      },
    });
  }

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

        <View style={styles.monthRow}>
          <Pressable style={styles.monthNavBtn} onPress={() => setVisibleMonth((prev) => addMonths(prev, -1))}>
            <Ionicons name="chevron-back" size={18} color="#D8E9FA" />
          </Pressable>
          <Text style={styles.monthText}>{monthLabel}</Text>
          <Pressable style={styles.monthNavBtn} onPress={() => setVisibleMonth((prev) => addMonths(prev, 1))}>
            <Ionicons name="chevron-forward" size={18} color="#D8E9FA" />
          </Pressable>
        </View>

        <View style={[styles.weekHeader, { width: gridWidth }]}>
          {DAY_LABELS.map((label) => (
            <Text key={label} style={[styles.weekHeaderText, { width: cellWidth }]}>
              {label}
            </Text>
          ))}
        </View>

        <View style={[styles.grid, { width: gridWidth }]}>
          {days.map(({ date, inCurrentMonth }) => {
            const active = isSameDay(selectedDate, date);
            const isToday = isSameDay(today, date);
            return (
              <Pressable
                key={toDateKey(date)}
                style={[
                  styles.dateItem,
                  { width: cellWidth },
                  !inCurrentMonth && styles.dateItemMuted,
                  active && styles.dateItemActive,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateText, !inCurrentMonth && styles.dateTextMuted, active && styles.dateTextActive]}>
                  {date.getDate()}
                </Text>
                {isToday && !active ? <View style={styles.todayDot} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.selectionNoteWrap}>
          <Text style={styles.selectionNoteLabel}>Selected Date</Text>
          <Text style={styles.selectionNoteValue}>
            {selectedDate.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
          </Text>
        </View>

        <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmText}>
            Use{" "}
            {selectedDate.toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  content: { flex: 1, paddingHorizontal: 10, paddingTop: 16, paddingBottom: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 22, fontWeight: "800" },
  monthRow: {
    height: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#223349",
    backgroundColor: "#101A28",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#162335",
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: { color: "#E7F2FD", fontSize: 18, fontWeight: "800" },
  weekHeader: { flexDirection: "row", marginBottom: 10, alignSelf: "center" },
  weekHeaderText: {
    textAlign: "center",
    color: "#88A2BD",
    fontSize: 12,
    fontWeight: "800",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, alignSelf: "center" },
  dateItem: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  dateItemMuted: { opacity: 0.45 },
  dateItemActive: { backgroundColor: "#3C84C9" },
  dateText: { color: "#D6E6F7", fontSize: 18, fontWeight: "700" },
  dateTextMuted: { color: "#7F98B3" },
  dateTextActive: { color: "#EEF7FF" },
  todayDot: {
    marginTop: 3,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#6DB7FF",
  },
  selectionNoteWrap: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2E42",
    backgroundColor: "#111B29",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionNoteLabel: { color: "#88A2BD", fontSize: 11, fontWeight: "700" },
  selectionNoteValue: { color: "#EAF4FF", fontSize: 14, fontWeight: "800", marginTop: 3 },
  confirmBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#5EB3F6",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: { color: "#041120", fontSize: 15, fontWeight: "900" },
  cancelBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#283C53",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { color: "#B7CCE2", fontSize: 14, fontWeight: "800" },
});
