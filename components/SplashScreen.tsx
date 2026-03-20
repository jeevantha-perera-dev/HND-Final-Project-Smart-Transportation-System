import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const pulse = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 7,
      }),
    ]).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.96,
          duration: 1300,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, scale, pulse]);

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=70&w=1600&auto=format&fit=crop",
      }}
      style={styles.container}
      imageStyle={styles.bgImage}
      resizeMode="cover"
      blurRadius={2}
    >
      <LinearGradient
        colors={["rgba(2,6,23,0.83)", "rgba(5,10,20,0.94)"]}
        style={styles.overlay}
      >
      <StatusBar barStyle="light-content" />
      <View style={styles.glow} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fade,
            transform: [{ scale }, { scale: pulse }],
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="bus-outline" size={68} color="#D8ECFF" />
        </View>
        <Text style={styles.brandTitle}>TransitFlow</Text>
        <Text style={styles.tagline}>Smart Travel. Simplified.</Text>
      </Animated.View>

      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color="#A9D2FF" />
      </View>
      <Text style={styles.versionText}>VERSION 2.0</Text>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    opacity: 0.86,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(71,153,255,0.22)",
  },
  content: {
    alignItems: "center",
  },
  iconWrapper: {
    backgroundColor: "rgba(17,47,90,0.72)",
    borderWidth: 1,
    borderColor: "#326CB2",
    borderRadius: 40,
    marginBottom: 22,
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 46,
    fontWeight: "800",
    color: "#F1F8FF",
    marginBottom: 5,
  },
  tagline: {
    fontSize: 18,
    color: "#B8CDE2",
    fontWeight: "400",
  },
  versionText: {
    position: "absolute",
    bottom: 60,
    color: "rgba(210,227,246,0.58)",
    fontSize: 12,
    letterSpacing: 1.9,
    fontWeight: "500",
  },
  loaderWrap: {
    position: "absolute",
    bottom: 98,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,51,93,0.55)",
    borderWidth: 1,
    borderColor: "rgba(94,146,211,0.38)",
  },
});
