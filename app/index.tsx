import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Onboarding from "../components/Onboarding";
import SplashScreen from "../components/SplashScreen";

export default function AppEntryPoint() {
  const [currentView, setCurrentView] = useState<
    "splash" | "onboarding" | "main"
  >("splash");

  useEffect(() => {
    const timer = setTimeout(() => setCurrentView("onboarding"), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (currentView === "splash") return <SplashScreen />;

  if (currentView === "onboarding") {
    return <Onboarding onFinish={() => setCurrentView("main")} />;
  }

  return (
    <View style={styles.main}>
      <Text style={styles.text}>🚀 Welcome to TransitEase Home!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: "#0B1223",
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
});
