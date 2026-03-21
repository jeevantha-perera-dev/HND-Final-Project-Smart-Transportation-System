import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DriverSettingsScreenProps = {
  onLogout?: () => void;
};

export default function DriverSettingsScreen({ onLogout }: DriverSettingsScreenProps) {
  const [pushAlerts, setPushAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoCheckIn, setAutoCheckIn] = useState(false);
  const [nightMode, setNightMode] = useState(true);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color="#E9F2FC" />
        </View>
        <View style={styles.profileText}>
          <Text style={styles.name}>John Fernando</Text>
          <Text style={styles.role}>Driver ID • DR-4438</Text>
          <Text style={styles.shift}>Active Shift • Morning</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.sectionCard}>
        <SwitchRow label="Push notifications" value={pushAlerts} onPress={() => setPushAlerts((p) => !p)} />
        <SwitchRow label="Sound alerts for incidents" value={soundAlerts} onPress={() => setSoundAlerts((p) => !p)} />
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.sectionCard}>
        <SwitchRow label="Auto check-in at first stop" value={autoCheckIn} onPress={() => setAutoCheckIn((p) => !p)} />
        <SwitchRow label="Night mode surfaces" value={nightMode} onPress={() => setNightMode((p) => !p)} />
      </View>

      <Text style={styles.sectionTitle}>Emergency</Text>
      <View style={styles.sectionCard}>
        <ActionRow icon="call-outline" title="Emergency Contact" subtitle="Transit Control +94 11 234 5678" />
        <ActionRow icon="shield-checkmark-outline" title="Safety Checklist" subtitle="Last reviewed today at 06:10 AM" />
      </View>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#F2A9B8" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function SwitchRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.switchRow} onPress={onPress}>
      <Text style={styles.switchLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.knob, value && styles.knobActive]} />
      </View>
    </Pressable>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={16} color="#8BB8E4" />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#071523" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243446",
    backgroundColor: "#1A232F",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2E4054",
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: { marginLeft: 10, flex: 1 },
  name: { color: "#EDF5FC", fontSize: 17, fontWeight: "800" },
  role: { color: "#9EB3C8", fontSize: 12, marginTop: 2, fontWeight: "700" },
  shift: { color: "#7FC6A0", fontSize: 12, marginTop: 2, fontWeight: "700" },
  sectionTitle: { color: "#D7E2ED", fontSize: 15, fontWeight: "800", marginBottom: 8 },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243446",
    backgroundColor: "#171F2B",
    padding: 12,
    marginBottom: 14,
  },
  switchRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  switchLabel: { color: "#C7D6E5", fontSize: 13, fontWeight: "600", flex: 1, paddingRight: 10 },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#445468",
    padding: 2,
  },
  toggleActive: { backgroundColor: "#4EAF80" },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#F0F6FF" },
  knobActive: { marginLeft: 18 },
  actionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1E2C3D",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { marginLeft: 9, flex: 1 },
  actionTitle: { color: "#E6EFF9", fontSize: 13, fontWeight: "700" },
  actionSubtitle: { color: "#93A8BD", fontSize: 11, marginTop: 2, fontWeight: "600" },
  logoutBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#5A2A37",
    backgroundColor: "#171F2B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  logoutText: { color: "#F2A9B8", fontSize: 15, fontWeight: "800" },
});
