import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DriverTripScannerScreenProps = {
  onBack?: () => void;
  onManualEntry?: () => void;
  /** Optional hook when a QR code is read (e.g. validate booking). */
  onQrScanned?: (data: string) => void;
};

export default function DriverTripScannerScreen({
  onBack,
  onManualEntry,
  onQrScanned,
}: DriverTripScannerScreenProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);
  const scanLockRef = useRef(false);

  const frameSize = useMemo(() => {
    const max = Math.min(width - 32, height * 0.42, 280);
    return Math.max(200, max);
  }, [width, height]);

  const barcodeSettings = useMemo(() => ({ barcodeTypes: ["qr" as const] }), []);

  const handleBarcodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (scanLockRef.current) return;
      scanLockRef.current = true;
      if (hapticsOn) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onQrScanned?.(data);
      if (onQrScanned) {
        setTimeout(() => {
          scanLockRef.current = false;
        }, 1800);
        return;
      }
      Alert.alert("QR scanned", data, [
        {
          text: "OK",
          onPress: () => {
            setTimeout(() => {
              scanLockRef.current = false;
            }, 400);
          },
        },
      ]);
    },
    [hapticsOn, onQrScanned]
  );

  const permissionGranted = permission?.granted === true;
  const canAskAgain = permission?.canAskAgain !== false;

  return (
    <View style={styles.screen}>
      <View style={styles.cameraHost}>
        {permissionGranted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchOn}
            barcodeScannerSettings={barcodeSettings}
            onBarcodeScanned={handleBarcodeScanned}
          />
        ) : (
          <View style={styles.permissionFallback}>
            {permission == null ? (
              <ActivityIndicator size="large" color="#5AAEFD" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={48} color="#7A8FA6" />
                <Text style={styles.permissionTitle}>Camera access</Text>
                <Text style={styles.permissionBody}>
                  We need the camera to scan passenger QR tickets.
                </Text>
                {canAskAgain ? (
                  <Pressable style={styles.permissionBtn} onPress={() => void requestPermission()}>
                    <Text style={styles.permissionBtnText}>Allow camera</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.permissionDenied}>Enable camera in system settings to scan.</Text>
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.dimOverlay} pointerEvents="none" />

        <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 8) }]} pointerEvents="box-none">
          <View style={styles.header} pointerEvents="box-none">
            <Pressable style={styles.backButton} onPress={onBack}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.headerTitle}>Scan Ticket</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.scanFrameArea} pointerEvents="none">
            <View style={[styles.scanSquare, { width: frameSize, height: frameSize }]}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={styles.scanLine} />
            </View>

            <View style={styles.hintPill}>
              <Ionicons name="scan-circle-outline" size={16} color="#DCEBFB" />
              <Text style={styles.hintText}>Point the QR code inside the frame</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.actionsRow}>
          <Pressable style={styles.manualButton} onPress={onManualEntry}>
            <Ionicons name="calendar-outline" size={18} color="#E8F1FB" />
            <Text style={styles.manualText}>Manual Entry</Text>
          </Pressable>
          <Pressable
            style={[styles.iconActionBtn, torchOn && styles.iconActionBtnActive]}
            onPress={() => setTorchOn((t) => !t)}
            disabled={!permissionGranted}
          >
            <Ionicons name={torchOn ? "flashlight" : "flashlight-outline"} size={20} color="#DDE9F7" />
          </Pressable>
          <Pressable
            style={[styles.iconActionBtn, !hapticsOn && styles.iconActionBtnMuted]}
            onPress={() => setHapticsOn((h) => !h)}
          >
            <Ionicons
              name={hapticsOn ? "volume-high-outline" : "volume-mute-outline"}
              size={20}
              color="#DDE9F7"
            />
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
  cameraHost: {
    flex: 1,
    backgroundColor: "#0A1018",
    overflow: "hidden",
  },
  permissionFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "#0A1018",
  },
  permissionTitle: {
    color: "#F4F8FF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
  },
  permissionBody: {
    color: "#9AB0C6",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  permissionBtn: {
    marginTop: 20,
    backgroundColor: "#5AAEFD",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#0A1628",
    fontSize: 16,
    fontWeight: "800",
  },
  permissionDenied: {
    color: "#C75C5C",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3,7,14,0.45)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 14,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#F4F8FF",
    fontSize: 22,
    fontWeight: "800",
    marginLeft: 6,
  },
  spacer: { flex: 1 },
  scanFrameArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanSquare: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#5AAEFD",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  scanLine: {
    position: "absolute",
    left: "12%",
    right: "12%",
    top: "50%",
    height: 2,
    backgroundColor: "#5AAEFD",
    opacity: 0.95,
  },
  hintPill: {
    marginTop: 20,
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
    fontSize: 14,
    fontWeight: "700",
  },
  bottomSection: {
    backgroundColor: "#0A0E16",
    borderTopWidth: 1,
    borderTopColor: "#1A2636",
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
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
    fontSize: 17,
    fontWeight: "800",
  },
  iconActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A3342",
    backgroundColor: "#161D27",
    alignItems: "center",
    justifyContent: "center",
  },
  iconActionBtnActive: {
    borderColor: "#3D6FA8",
    backgroundColor: "#1A2A40",
  },
  iconActionBtnMuted: {
    opacity: 0.65,
  },
});
