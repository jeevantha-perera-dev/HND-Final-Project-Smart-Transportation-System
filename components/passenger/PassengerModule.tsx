import React from "react";
import { NavigationIndependentTree } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import TripsScreen from "./screens/TripsScreen";
import QRTicketScreen from "./screens/QRTicketScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import RateTripScreen from "./screens/RateTripScreen";
import LiveTrackingScreen from "./screens/LiveTrackingScreen";
import RouteSearchScreen from "./screens/RouteSearchScreen";
import PassengerHomeScreen from "./screens/PassengerHomeScreen";
import WalletScreen from "./screens/WalletScreen";
import {
  PassengerHomeStackParamList,
  PassengerRootStackParamList,
  PassengerTabsParamList,
} from "./types";
import { colors } from "./theme";
import ProfileAndSettingsScreen from "../shared/SettingsScreen";

const Tabs = createBottomTabNavigator<PassengerTabsParamList>();
const RootStack = createNativeStackNavigator<PassengerRootStackParamList>();
const HomeStack = createNativeStackNavigator<PassengerHomeStackParamList>();

type PassengerModuleProps = {
  onLogout?: () => void;
};

function HomeStackScreens() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <HomeStack.Screen name="HomeMain" component={PassengerHomeScreen} />
      <HomeStack.Screen name="RouteSearch" component={RouteSearchScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabs({ onLogout }: PassengerModuleProps) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 66,
          backgroundColor: "#0A121E",
          borderTopColor: "#1B2A3A",
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 6,
        },
        tabBarItemStyle: { flex: 1 },
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: "#7F90A6",
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<keyof PassengerTabsParamList, keyof typeof Ionicons.glyphMap> = {
            Home: focused ? "home" : "home-outline",
            Trips: focused ? "list" : "list-outline",
            Wallet: focused ? "wallet" : "wallet-outline",
            Alerts: focused ? "notifications" : "notifications-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return <Ionicons name={map[route.name as keyof PassengerTabsParamList]} color={color} size={size} />;
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeStackScreens} options={{ title: "Home" }} />
      <Tabs.Screen name="Trips" component={TripsScreen} options={{ title: "Trips" }} />
      <Tabs.Screen name="Wallet" component={WalletScreen} options={{ title: "Wallet" }} />
      <Tabs.Screen name="Alerts" component={NotificationsScreen} options={{ title: "Alerts" }} />
      <Tabs.Screen name="Profile" options={{ title: "Profile" }}>
        {() => (
          <ProfileAndSettingsScreen
            showBottomTabs={false}
            onLogout={onLogout}
          />
        )}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

export default function PassengerModule({ onLogout }: PassengerModuleProps) {
  return (
    <NavigationIndependentTree>
      <RootStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <RootStack.Screen name="MainTabs">
          {() => <MainTabs onLogout={onLogout} />}
        </RootStack.Screen>
        <RootStack.Screen name="QRTicket" component={QRTicketScreen} />
        <RootStack.Screen name="RateTrip" component={RateTripScreen} />
        <RootStack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      </RootStack.Navigator>
    </NavigationIndependentTree>
  );
}
