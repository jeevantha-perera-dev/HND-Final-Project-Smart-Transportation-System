import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    // The View wrapper ensures the background color is consistent during transitions
    <View style={{ flex: 1, backgroundColor: "#0B1223" }}>
      {/* 1. Correct Status Bar: Style "light" for white text/icons */}
      <StatusBar style="light" />

      {/* 2. The Stack: Manages the navigation between index.tsx and other screens */}
      <Stack
        screenOptions={{
          // This hides the white "index" header globally
          headerShown: false,
          // Sets the background of the screen container itself
          contentStyle: { backgroundColor: "#0B1223" },
          // Optional: Adds a smooth fade transition between screens
          animation: "fade",
        }}
      >
        {/* Explicitly defining the index screen (your Splash/Onboarding) */}
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
}
