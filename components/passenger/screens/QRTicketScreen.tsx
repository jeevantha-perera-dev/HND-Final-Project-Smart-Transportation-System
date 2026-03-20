import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../theme";
import { PrimaryButton } from "../ui";
import PassengerBottomNav from "../PassengerBottomNav";
import { PassengerRootStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "QRTicket">;

export default function QRTicketScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>QR Ticket</Text>
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketBrand}>TransitFlow Express</Text>
              <Text style={styles.ticketBadge}>Premium Ticket</Text>
            </View>
            <View style={styles.routeRow}>
              <View>
                <Text style={styles.city}>NYC</Text>
                <Text style={styles.cityCaption}>NEW YORK</Text>
              </View>
              <View style={styles.routeCenter}>
                <View style={styles.routeLine} />
                <Ionicons name="bus-outline" size={16} color="#8EC5FF" />
                <View style={styles.routeLine} />
              </View>
              <View>
                <Text style={styles.city}>PHL</Text>
                <Text style={styles.cityCaption}>PHILADELPHIA</Text>
              </View>
            </View>

            <View style={styles.qrWrap}>
              <View style={styles.qrCore}>
                <Ionicons name="qr-code-outline" size={88} color="#2B3C50" />
              </View>
            </View>

            <View style={styles.infoGrid}>
              <Info label="CAPTURE DATE" value="Oct 24, 2024" />
              <Info label="DEPARTURE TIME" value="10:30 AM" />
              <Info label="SEAT" value="12A Window" />
              <Info label="BUS" value="Platform 4" />
            </View>

            <View style={styles.footerRow}>
              <View>
                <Text style={styles.footerLabel}>Passenger</Text>
                <Text style={styles.footerValue}>John Doe</Text>
              </View>
              <View>
                <Text style={styles.footerLabel}>Fare</Text>
                <Text style={styles.footerValue}>$45.00</Text>
              </View>
            </View>
          </View>
          <PrimaryButton title="Track Bus Live" onPress={() => navigation.navigate("LiveTracking")} />
        </ScrollView>
        <PassengerBottomNav active="Trips" />
      </LinearGradient>
    </SafeAreaView>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: spacing.page, paddingBottom: 24 },
  title: { color: colors.textPrimary, fontSize: 27, fontWeight: "800", marginBottom: 12 },
  ticketCard: {
    borderRadius: 18,
    backgroundColor: "#E5EAF0",
    padding: 12,
    marginBottom: 14,
  },
  ticketHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  ticketBrand: { color: "#145390", fontWeight: "800", fontSize: 12 },
  ticketBadge: { color: "#225F9E", fontSize: 10, fontWeight: "700" },
  routeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  city: { color: "#0D1A2B", fontSize: 32, fontWeight: "800" },
  cityCaption: { color: "#516175", fontSize: 10, fontWeight: "700", letterSpacing: 0.7 },
  routeCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  routeLine: { height: 1, width: 28, backgroundColor: "#9BB8D8" },
  qrWrap: {
    borderRadius: 12,
    backgroundColor: "#F7F9FC",
    borderWidth: 1,
    borderColor: "#D6DEE7",
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  qrCore: {
    width: 170,
    height: 170,
    borderRadius: 8,
    backgroundColor: "#C9D6E5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  infoItem: { width: "50%" },
  infoLabel: { color: "#5E6E84", fontSize: 9, fontWeight: "700", letterSpacing: 0.6 },
  infoValue: { color: "#1E2D41", fontSize: 12, fontWeight: "800", marginTop: 2 },
  footerRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#CED8E2",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLabel: { color: "#6A798E", fontSize: 10, fontWeight: "700" },
  footerValue: { color: "#19314D", fontSize: 13, fontWeight: "800", marginTop: 1 },
});
