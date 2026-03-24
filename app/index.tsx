import React, { useEffect, useState } from "react";
import LoginScreen from "../components/auth/LoginScreen";
import RegisterScreen from "../components/auth/RegisterScreen";
import Onboarding from "../components/Onboarding";
import DriverHome from "../components/driver/DriverHome";
import PassengerModule from "../components/passenger/PassengerModule";
import SplashScreen from "../components/SplashScreen";
import { login, register } from "../services/api/auth";
import { clearSession } from "../services/api/session";

export default function AppEntryPoint() {
  const [currentView, setCurrentView] = useState<
    "splash" | "onboarding" | "login" | "register" | "driver-main" | "passenger-main"
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
    clearSession();
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
        onLogin={async ({ role, email, password }) => {
          const apiRole = role === "driver" ? "DRIVER" : "PASSENGER";
          await login({ email, password });
          setCurrentView(apiRole === "DRIVER" ? "driver-main" : "passenger-main");
        }}
        onRegister={() => setCurrentView("register")}
      />
    );
  }

  if (currentView === "register") {
    return (
      <RegisterScreen
        onBack={() => setCurrentView("login")}
        onSignIn={() => setCurrentView("login")}
        onCreateAccount={async ({ role, fullName, email, phone, password }) => {
          const apiRole = role === "driver" ? "DRIVER" : "PASSENGER";
          await register({
            role: apiRole,
            fullName,
            email,
            phone,
            password,
          });
          setCurrentView(apiRole === "DRIVER" ? "driver-main" : "passenger-main");
        }}
      />
    );
  }

  if (currentView === "driver-main") {
    return <DriverHome onLogout={handleLogout} />;
  }

  return <PassengerModule onLogout={handleLogout} />;
}
