import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DriverReportIncidentScreenProps = {
  onBack?: () => void;
  onSubmit?: () => void;
};

export default function DriverReportIncidentScreen({
  onBack,
  onSubmit,
}: DriverReportIncidentScreenProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E4EEF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Report Incident</Text>
      </View>

      <View style={styles.separator} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tripCard}>
          <View style={styles.tripLeft}>
            <View style={styles.tripIconWrap}>
              <Ionicons name="bus-outline" size={16} color="#84BBF6" />
            </View>
            <View>
              <Text style={styles.tripLabel}>Active Trip</Text>
              <Text style={styles.tripTitle}>Route 402 • Central Station</Text>
              <View style={styles.startedRow}>
                <Ionicons name="time-outline" size={13} color="#A9C5E3" />
                <Text style={styles.startedText}>Started 24 mins ago</Text>
              </View>
            </View>
          </View>
          <View style={styles.tripIdBadge}>
            <Text style={styles.tripIdText}>ID: TF-902</Text>
          </View>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle-outline" size={17} color="#7EB7F6" />
          <Text style={styles.warningText}>
            Please provide accurate details. Urgent safety emergencies should be
            reported via the SOS button on your dashboard first.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="alert-circle-outline" size={16} color="#8FA4BB" />
            <Text style={styles.label}>Incident Category</Text>
          </View>
          <Pressable style={styles.selectInput}>
            <Text style={styles.selectText}>Select issue type</Text>
            <Ionicons name="chevron-down" size={18} color="#93A8BE" />
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="warning-outline" size={16} color="#8FA4BB" />
            <Text style={styles.label}>Detailed Description</Text>
          </View>
          <TextInput
            multiline
            placeholder="Explain what happened in detail...."
            placeholderTextColor="#8A9DB2"
            style={styles.textArea}
          />
        </View>

        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="camera-outline" size={16} color="#8FA4BB" />
            <Text style={styles.label}>Evidence (Optional)</Text>
          </View>
          <Pressable style={styles.evidenceBox}>
            <View style={styles.evidenceIconWrap}>
              <Ionicons name="camera-outline" size={24} color="#E4EEF8" />
            </View>
            <Text style={styles.evidenceTitle}>Add Photos or Video</Text>
            <Text style={styles.evidenceSub}>
              Capture clear images of the incident, vehicle damage, or road conditions.
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.confirmRow} onPress={() => setConfirmed((prev) => !prev)}>
          <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
            {confirmed ? <Ionicons name="checkmark" size={12} color="#0B2745" /> : null}
          </View>
          <Text style={styles.confirmText}>
            I confirm that the information provided above is accurate and true
            to the best of my knowledge.
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitBtn, !confirmed && styles.submitBtnDisabled]}
          disabled={!confirmed}
          onPress={onSubmit}
        >
          <Text style={[styles.submitText, !confirmed && styles.submitTextDisabled]}>
            Submit Report
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D" },
  header: { height: 54, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EBF3FC", fontSize: 30, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1F2D3F" },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  tripCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#155A9E",
    backgroundColor: "#0B3D73",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tripLeft: { flexDirection: "row", gap: 10, flex: 1 },
  tripIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#134777",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tripLabel: { color: "#CBE0F5", fontSize: 12, fontWeight: "700" },
  tripTitle: { color: "#F4FAFF", fontSize: 17, fontWeight: "800", marginTop: 1 },
  startedRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  startedText: { color: "#A9C5E3", fontSize: 13, fontWeight: "700" },
  tripIdBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#123A63",
    borderWidth: 1,
    borderColor: "#2D618E",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tripIdText: { color: "#C8DCF0", fontSize: 11, fontWeight: "700" },
  warningBox: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#7E8A99",
    backgroundColor: "#9CA8B5",
    padding: 10,
    flexDirection: "row",
    gap: 8,
  },
  warningText: { flex: 1, color: "#3B4A5B", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  fieldGroup: { marginTop: 14 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  label: { color: "#D7E3EF", fontSize: 16, fontWeight: "800" },
  selectInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#273344",
    backgroundColor: "#161E2A",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#EAF2FB", fontSize: 14, fontWeight: "700" },
  textArea: {
    minHeight: 108,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#273344",
    backgroundColor: "#161E2A",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#EAF2FB",
    textAlignVertical: "top",
    fontSize: 14,
  },
  evidenceBox: {
    minHeight: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A3546",
    borderStyle: "dashed",
    backgroundColor: "#151D28",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  evidenceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1D2735",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  evidenceTitle: { color: "#EEF5FC", fontSize: 16, fontWeight: "800" },
  evidenceSub: { color: "#A9B8C8", fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: 6, fontWeight: "600" },
  confirmRow: { marginTop: 14, flexDirection: "row", gap: 9, alignItems: "flex-start" },
  checkbox: {
    marginTop: 1,
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#2B5F94",
    backgroundColor: "#111A25",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#67A9EA",
    borderColor: "#67A9EA",
  },
  confirmText: { flex: 1, color: "#C8D7E7", fontSize: 13, lineHeight: 18, fontWeight: "600" },
  footer: { borderTopWidth: 1, borderTopColor: "#1D2B3D", padding: 14, backgroundColor: "#0A121D" },
  submitBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#64AEEF",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#5A6A7F",
  },
  submitText: { color: "#244A72", fontSize: 20, fontWeight: "800" },
  submitTextDisabled: { color: "#8DA0B6" },
});
