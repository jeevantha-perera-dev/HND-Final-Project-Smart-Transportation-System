import React, { useEffect, useState } from "react";
import LoginScreen, { UserRole } from "../components/auth/LoginScreen";
import Onboarding from "../components/Onboarding";
import DriverHome from "../components/driver/DriverHome";
import PassengerModule from "../components/passenger/PassengerModule";
import SplashScreen from "../components/SplashScreen";

export default function AppEntryPoint() {
  const [currentView, setCurrentView] = useState<
    "splash" | "onboarding" | "login" | "driver-main" | "passenger-main"
  >("splash");
  const [splashTarget, setSplashTarget] = useState<"onboarding" | "login">(
    "onboarding",
  );

  useEffect(() => {
    if (currentView !== "splash") return;

    const timer = setTimeout(() => setCurrentView(splashTarget), 3000);
    return () => clearTimeout(timer);
  }, [currentView, splashTarget]);

  const handleLogout = () => {
    // On logout: always restart from splash, then go directly to login.
    setSplashTarget("login");
    setCurrentView("splash");
  };

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
    return <DriverHome onLogout={handleLogout} />;
  }

  return <PassengerModule onLogout={handleLogout} />;
}
