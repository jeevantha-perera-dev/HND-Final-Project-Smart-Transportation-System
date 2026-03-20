import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FilterChip from "./FilterChip";

export type TripFilters = {
  date: "All" | "Today" | "Tomorrow" | "Custom";
  busStatus: "All" | "Live Now" | "Upcoming" | "Completed";
  route: "All" | "R-104" | "R-202" | "R-304" | "R-203";
  timeRange: "All" | "Morning" | "Afternoon" | "Evening";
};

type FilterModalProps = {
  visible: boolean;
  draftFilters: TripFilters;
  onChange: (next: TripFilters) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
};

const dateOptions: TripFilters["date"][] = ["All", "Today", "Tomorrow", "Custom"];
const statusOptions: TripFilters["busStatus"][] = [
  "All",
  "Live Now",
  "Upcoming",
  "Completed",
];
const routeOptions: TripFilters["route"][] = [
  "All",
  "R-104",
  "R-202",
  "R-304",
  "R-203",
];
const timeOptions: TripFilters["timeRange"][] = [
  "All",
  "Morning",
  "Afternoon",
  "Evening",
];

export default function FilterModal({
  visible,
  draftFilters,
  onChange,
  onClose,
  onApply,
  onReset,
}: FilterModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Filter Trips</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={20} color="#C9DBF0" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FilterSection title="Date">
            {dateOptions.map((opt) => (
              <FilterChip
                key={opt}
                label={opt}
                active={draftFilters.date === opt}
                onPress={() => onChange({ ...draftFilters, date: opt })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Bus Status">
            {statusOptions.map((opt) => (
              <FilterChip
                key={opt}
                label={opt}
                active={draftFilters.busStatus === opt}
                onPress={() => onChange({ ...draftFilters, busStatus: opt })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Route">
            {routeOptions.map((opt) => (
              <FilterChip
                key={opt}
                label={opt}
                active={draftFilters.route === opt}
                onPress={() => onChange({ ...draftFilters, route: opt })}
              />
            ))}
          </FilterSection>

          <FilterSection title="Time Range">
            {timeOptions.map((opt) => (
              <FilterChip
                key={opt}
                label={opt}
                active={draftFilters.timeRange === opt}
                onPress={() => onChange({ ...draftFilters, timeRange: opt })}
              />
            ))}
          </FilterSection>
        </ScrollView>

        <View style={styles.footerRow}>
          <Pressable style={styles.resetBtn} onPress={onReset}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={onApply}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chipsWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    maxHeight: "76%",
    backgroundColor: "#0F1A29",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: "#21344B",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: "#2E425A",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { color: "#ECF5FF", fontSize: 19, fontWeight: "800" },
  content: { paddingTop: 8, paddingBottom: 10, gap: 14 },
  section: { gap: 8 },
  sectionTitle: { color: "#BFD2E7", fontSize: 13, fontWeight: "700" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  footerRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  resetBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2F4B6A",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#122136",
  },
  resetText: { color: "#BFD3EB", fontSize: 14, fontWeight: "700" },
  applyBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
  },
  applyText: { color: "#ECF5FF", fontSize: 14, fontWeight: "800" },
});
