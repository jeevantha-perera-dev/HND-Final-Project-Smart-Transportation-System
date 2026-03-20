import React from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DriverTripScannerScreenProps = {
  onBack?: () => void;
  onManualEntry?: () => void;
};

export default function DriverTripScannerScreen({
  onBack,
  onManualEntry,
}: DriverTripScannerScreenProps) {
  return (
    <View style={styles.screen}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=900&auto=format&fit=crop",
        }}
        style={styles.cameraArea}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>Scan Ticket</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.scanFrameArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.scanLine} />

            <View style={styles.hintPill}>
              <Ionicons name="scan-circle-outline" size={16} color="#DCEBFB" />
              <Text style={styles.hintText}>Enter the QR code in the frame</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.bottomSection}>
        <View style={styles.lastBoardedCard}>
          <View style={styles.personIconWrap}>
            <Ionicons name="person-add-outline" size={18} color="#78AFFF" />
          </View>
          <View style={styles.lastBoardedTextWrap}>
            <Text style={styles.lastBoardedLabel}>Last Boarded</Text>
            <Text style={styles.lastBoardedName}>James Wilson • Seat 14A</Text>
          </View>
          <View style={styles.capacityPill}>
            <Text style={styles.capacityText}>24 / 40</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.manualButton} onPress={onManualEntry}>
            <Ionicons name="calendar-outline" size={18} color="#E8F1FB" />
            <Text style={styles.manualText}>Manual Entry</Text>
          </Pressable>
          <Pressable style={styles.soundButton}>
            <Ionicons name="volume-mute-outline" size={20} color="#DDE9F7" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#060A13",
  },
  cameraArea: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3,7,14,0.58)",
    paddingHorizontal: 14,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#F4F8FF",
    fontSize: 34,
    fontWeight: "800",
    marginLeft: 6,
  },
  spacer: { flex: 1 },
  scanFrameArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 58,
    height: 58,
    borderColor: "#5AAEFD",
  },
  topLeft: {
    top: 84,
    left: 16,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  topRight: {
    top: 84,
    right: 16,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  bottomLeft: {
    bottom: 168,
    left: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: 168,
    right: 16,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  scanLine: {
    position: "absolute",
    left: 72,
    right: 72,
    top: "52%",
    height: 2,
    backgroundColor: "#5AAEFD",
  },
  hintPill: {
    position: "absolute",
    bottom: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(119,157,198,0.45)",
    backgroundColor: "rgba(10,20,34,0.86)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  hintText: {
    color: "#DCEBFB",
    fontSize: 15,
    fontWeight: "700",
  },
  bottomSection: {
    backgroundColor: "#0A0E16",
    borderTopWidth: 1,
    borderTopColor: "#1A2636",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  lastBoardedCard: {
    minHeight: 78,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A3443",
    backgroundColor: "#1A212B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  personIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#243244",
    alignItems: "center",
    justifyContent: "center",
  },
  lastBoardedTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  lastBoardedLabel: {
    color: "#9AB0C6",
    fontSize: 13,
    fontWeight: "700",
  },
  lastBoardedName: {
    color: "#F1F7FF",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
  },
  capacityPill: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#2ABD6C",
    backgroundColor: "rgba(19,56,36,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  capacityText: {
    color: "#45D785",
    fontSize: 14,
    fontWeight: "800",
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  manualButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A3342",
    backgroundColor: "#161D27",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  manualText: {
    color: "#E8F1FB",
    fontSize: 18,
    fontWeight: "800",
  },
  soundButton: {
    width: 58,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A3342",
    backgroundColor: "#161D27",
    alignItems: "center",
    justifyContent: "center",
  },
});
