import React from "react";
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Set status bar to light to match the white text */}
      <StatusBar barStyle="light-content" />

      <View style={styles.content}>
        {/* The Icon Wrapper (Rounded Square) */}
        <View style={styles.iconWrapper}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3448/3448339.png",
            }}
            style={styles.busIcon}
          />
        </View>

        {/* Branding */}
        <Text style={styles.brandTitle}>TransitEase</Text>
        <Text style={styles.tagline}>Your Route, Simplified</Text>
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        <Text style={styles.versionText}>VERSION 2.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#007AFF", // This is the vibrant blue from your image
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  iconWrapper: {
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Light translucent white
    padding: 25,
    borderRadius: 35, // Smooth rounded corners
    marginBottom: 20,
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  busIcon: {
    width: 80,
    height: 80,
    tintColor: "#FFFFFF", // Forces image to be pure white
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: "800", // Extra bold
    color: "#FFFFFF",
    marginBottom: 5,
  },
  tagline: {
    fontSize: 18,
    color: "#E0E0E0",
    fontWeight: "400",
  },
  footer: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
  },
  loader: {
    marginBottom: 20,
    transform: [{ scale: 1.2 }], // Makes the spinner slightly larger
  },
  versionText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    letterSpacing: 2, // Spacing out the letters like your image
    fontWeight: "500",
  },
});
