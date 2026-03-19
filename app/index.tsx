import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import LoginScreen, { UserRole } from "../components/auth/LoginScreen";
import DriverHome from "../components/driver/DriverHome";
import Onboarding from "../components/Onboarding";
import SplashScreen from "../components/SplashScreen";

export default function AppEntryPoint() {
  const [currentView, setCurrentView] = useState<
    "splash" | "onboarding" | "login" | "driver-main" | "passenger-main"
  >("splash");

  useEffect(() => {
    const timer = setTimeout(() => setCurrentView("onboarding"), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (currentView === "splash") return <SplashScreen />;

  if (currentView === "onboarding") {
    return <Onboarding onFinish={() => setCurrentView("login")} />;
  }

  if (currentView === "login") {
    return (
      <LoginScreen
        onLogin={(role: UserRole) =>
          setCurrentView(role === "driver" ? "driver-main" : "passenger-main")
        }
      />
    );
  }

  if (currentView === "driver-main") {
    return <DriverHome />;
  }

  return (
    <View style={styles.main}>
      <Text style={styles.text}>Passenger home screen coming next.</Text>
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
