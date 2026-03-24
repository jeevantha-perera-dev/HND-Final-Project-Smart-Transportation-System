import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerRootStackParamList } from "../types";
import { createSosEvent } from "../../../services/api/sos";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "EmergencySOS">;

export default function EmergencySOSScreen({ navigation }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleShareLocation() {
    try {
      const res = await createSosEvent({
        latitude: 6.9271,
        longitude: 79.8612,
      });
      setMessage(res.address ? `Alert sent: ${res.address}` : "Alert sent successfully");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send SOS");
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color="#FCEDED" />
          </Pressable>
          <Text style={styles.title}>Emergency SOS</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.alertCard}>
          <Ionicons name="warning-outline" size={26} color="#FFD7D6" />
          <Text style={styles.alertTitle}>Need help right now?</Text>
          <Text style={styles.alertBody}>
            Contact emergency services or share your live trip details with trusted contacts.
          </Text>
        </View>

        <Pressable style={styles.primaryAction}>
          <Ionicons name="call-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryText}>Call Emergency Services</Text>
        </Pressable>

        <Pressable style={styles.secondaryAction} onPress={handleShareLocation}>
          <Ionicons name="share-social-outline" size={18} color="#FFD7D6" />
          <Text style={styles.secondaryText}>Share Live Location</Text>
        </Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#2B0B0B" },
  content: { flex: 1, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#FCEDED", fontSize: 20, fontWeight: "800" },
  alertCard: { borderRadius: 16, borderWidth: 1, borderColor: "#7E2626", backgroundColor: "#4A1515", padding: 14, marginBottom: 16 },
  alertTitle: { color: "#FFE6E6", fontSize: 18, fontWeight: "900", marginTop: 8 },
  alertBody: { color: "#FFD7D6", fontSize: 13, marginTop: 6, lineHeight: 18 },
  primaryAction: { height: 52, borderRadius: 12, backgroundColor: "#C62828", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  secondaryAction: { height: 52, borderRadius: 12, borderWidth: 1, borderColor: "#8C3131", backgroundColor: "#5A1A1A", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryText: { color: "#FFD7D6", fontSize: 15, fontWeight: "800" },
  message: { color: "#FFD7D6", fontSize: 12, marginTop: 10, textAlign: "center" },
});
