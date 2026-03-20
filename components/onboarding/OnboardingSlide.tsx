import React, { useEffect, useRef } from "react";
import { Animated, ImageBackground, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

type SlideData = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundImage: string;
};

export default function OnboardingSlide({
  title,
  subtitle,
  icon,
  backgroundImage,
}: SlideData) {
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -8,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatY]);

  return (
    <View style={styles.wrap}>
      <ImageBackground
        source={{ uri: backgroundImage }}
        style={styles.illustration}
        imageStyle={styles.bgImage}
        resizeMode="cover"
        blurRadius={1.8}
      >
        <LinearGradient
          colors={["rgba(2,6,23,0.8)", "rgba(15,23,42,0.9)"]}
          style={styles.overlay}
        >
          <View style={styles.vignette} />
          <View style={styles.glow} />
          <Animated.View
            style={[styles.iconBubble, { transform: [{ translateY: floatY }] }]}
          >
            <Ionicons name={icon} size={56} color="#9DCCFF" />
          </Animated.View>
          <View style={styles.track} />
        </LinearGradient>
      </ImageBackground>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", alignItems: "center", paddingHorizontal: 24 },
  illustration: {
    width: "100%",
    height: 270,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#234A7C",
    overflow: "hidden",
    marginBottom: 26,
  },
  bgImage: { opacity: 0.78 },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(101,149,214,0.16)",
    backgroundColor: "rgba(2,8,22,0.18)",
  },
  glow: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(72,153,255,0.22)",
    position: "absolute",
  },
  iconBubble: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,31,62,0.92)",
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  track: {
    position: "absolute",
    bottom: 30,
    width: "78%",
    height: 8,
    borderRadius: 8,
    backgroundColor: "rgba(205,230,255,0.25)",
  },
  title: {
    color: "#F0F7FF",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: "#AFC2D9",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
