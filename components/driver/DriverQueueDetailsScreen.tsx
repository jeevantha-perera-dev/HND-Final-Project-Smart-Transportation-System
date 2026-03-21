import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type DriverPassengerDetails = {
  id: string;
  name: string;
  type: "Adult" | "Student" | "Senior";
  tickets: string;
  seat?: string;
};

type DriverQueueDetailsScreenProps = {
  passenger?: DriverPassengerDetails | null;
  onBack?: () => void;
};

const SEATS = ["14A", "14B", "15A", "15B", "16A", "16B"];

export default function DriverQueueDetailsScreen({
  passenger,
  onBack,
}: DriverQueueDetailsScreenProps) {
  const [isBoarded, setIsBoarded] = useState(false);
  const [isNoShow, setIsNoShow] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(passenger?.seat ?? "14A");
  const [note, setNote] = useState("");

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E4EEF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Queue Details</Text>
      </View>
      <View style={styles.separator} />

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color="#DDEAF8" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{passenger?.name ?? "Julian Richards"}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaBadge}>{passenger?.type ?? "Adult"}</Text>
            <Text style={styles.metaText}>• {passenger?.tickets ?? "1 Ticket(s)"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.stateCard}>
        <Text style={styles.sectionTitle}>Boarding State</Text>
        <Pressable style={styles.switchRow} onPress={() => setIsBoarded((prev) => !prev)}>
          <Text style={styles.switchLabel}>Marked as Boarded</Text>
          <View style={[styles.toggle, isBoarded && styles.toggleActive]}>
            <View style={[styles.knob, isBoarded && styles.knobActive]} />
          </View>
        </Pressable>
        <Pressable style={styles.switchRow} onPress={() => setIsNoShow((prev) => !prev)}>
          <Text style={styles.switchLabel}>Marked as No-Show</Text>
          <View style={[styles.toggle, isNoShow && styles.toggleActiveDanger]}>
            <View style={[styles.knob, isNoShow && styles.knobActive]} />
          </View>
        </Pressable>
      </View>

      <View style={styles.stateCard}>
        <Text style={styles.sectionTitle}>Seat Assignment</Text>
        <View style={styles.seatGrid}>
          {SEATS.map((seat) => (
            <Pressable
              key={seat}
              style={[styles.seatChip, selectedSeat === seat && styles.seatChipActive]}
              onPress={() => setSelectedSeat(seat)}
            >
              <Text style={[styles.seatText, selectedSeat === seat && styles.seatTextActive]}>
                {seat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.stateCard}>
        <Text style={styles.sectionTitle}>Driver Note</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          placeholder="Add a quick note for this passenger..."
          placeholderTextColor="#8398AE"
          style={styles.noteInput}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D", paddingHorizontal: 14, paddingTop: 8 },
  header: { height: 46, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1F2D3F", marginTop: 6, marginBottom: 12 },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#293546",
    backgroundColor: "#1A232F",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E4054",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: { marginLeft: 10, flex: 1 },
  name: { color: "#EEF5FC", fontSize: 17, fontWeight: "800" },
  metaRow: { marginTop: 3, flexDirection: "row", alignItems: "center" },
  metaBadge: {
    borderRadius: 999,
    backgroundColor: "#22364D",
    color: "#7EB1E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },
  metaText: { color: "#A8BCCD", fontSize: 12, marginLeft: 6, fontWeight: "600" },
  stateCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#283446",
    backgroundColor: "#171F2B",
    padding: 12,
  },
  sectionTitle: { color: "#D9E5F1", fontSize: 15, fontWeight: "800", marginBottom: 8 },
  switchRow: {
    height: 38,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabel: { color: "#C2D2E2", fontSize: 13, fontWeight: "600" },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#455468",
    padding: 2,
  },
  toggleActive: { backgroundColor: "#4DAE7E" },
  toggleActiveDanger: { backgroundColor: "#A34B5A" },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#EFF6FF" },
  knobActive: { marginLeft: 18 },
  seatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  seatChip: {
    width: 52,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#37506D",
    backgroundColor: "#152333",
    alignItems: "center",
    justifyContent: "center",
  },
  seatChipActive: { backgroundColor: "#66AEEF", borderColor: "#66AEEF" },
  seatText: { color: "#BFD3E9", fontSize: 12, fontWeight: "700" },
  seatTextActive: { color: "#214A75" },
  noteInput: {
    minHeight: 86,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A3A4E",
    backgroundColor: "#141E2A",
    color: "#EAF2FB",
    textAlignVertical: "top",
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});
