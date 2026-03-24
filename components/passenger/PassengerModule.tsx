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
import AvailableBusesScreen from "./screens/AvailableBusesScreen";
import SeatSelectionScreen from "./screens/SeatSelectionScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import PassengerHomeScreen from "./screens/PassengerHomeScreen";
import WalletScreen from "./screens/WalletScreen";
import AddMoneyScreen from "./screens/AddMoneyScreen";
import TransferScreen from "./screens/TransferScreen";
import VouchersScreen from "./screens/VouchersScreen";
import RewardsScreen from "./screens/RewardsScreen";
import WalletHistoryScreen from "./screens/WalletHistoryScreen";
import WalletStatementScreen from "./screens/WalletStatementScreen";
import HomeBusesListScreen from "./screens/HomeBusesListScreen";
import NearestStopsScreen from "./screens/NearestStopsScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import ExpressRoutesScreen from "./screens/ExpressRoutesScreen";
import NearbyStopsScreen from "./screens/NearbyStopsScreen";
import HomeInsightsScreen from "./screens/HomeInsightsScreen";
import CalendarPickerScreen from "./screens/CalendarPickerScreen";
import RouteOptionsScreen from "./screens/RouteOptionsScreen";
import EmergencySOSScreen from "./screens/EmergencySOSScreen";
import {
  PassengerHomeStackParamList,
  PassengerRootStackParamList,
  PassengerTabsParamList,
  PassengerWalletStackParamList,
} from "./types";
import { colors } from "./theme";
import ProfileAndSettingsScreen from "../shared/SettingsScreen";

const Tabs = createBottomTabNavigator<PassengerTabsParamList>();
const RootStack = createNativeStackNavigator<PassengerRootStackParamList>();
const HomeStack = createNativeStackNavigator<PassengerHomeStackParamList>();
const WalletStack = createNativeStackNavigator<PassengerWalletStackParamList>();

type PassengerModuleProps = {
  onLogout?: () => void;
};

function HomeStackScreens() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <HomeStack.Screen name="HomeMain" component={PassengerHomeScreen} />
      <HomeStack.Screen name="RouteSearch" component={RouteSearchScreen} />
      <HomeStack.Screen name="AvailableBuses" component={AvailableBusesScreen} />
      <HomeStack.Screen name="SeatSelection" component={SeatSelectionScreen} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} />
      <HomeStack.Screen name="HomeBusesList" component={HomeBusesListScreen} />
      <HomeStack.Screen name="NearestStops" component={NearestStopsScreen} />
      <HomeStack.Screen name="Favorites" component={FavoritesScreen} />
      <HomeStack.Screen name="ExpressRoutes" component={ExpressRoutesScreen} />
      <HomeStack.Screen name="NearbyStops" component={NearbyStopsScreen} />
      <HomeStack.Screen name="HomeInsights" component={HomeInsightsScreen} />
    </HomeStack.Navigator>
  );
}

function WalletStackScreens() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <WalletStack.Screen name="WalletMain" component={WalletScreen} />
      <WalletStack.Screen name="AddMoney" component={AddMoneyScreen} />
      <WalletStack.Screen name="Transfer" component={TransferScreen} />
      <WalletStack.Screen name="Vouchers" component={VouchersScreen} />
      <WalletStack.Screen name="Rewards" component={RewardsScreen} />
      <WalletStack.Screen name="WalletHistory" component={WalletHistoryScreen} />
      <WalletStack.Screen name="WalletStatement" component={WalletStatementScreen} />
    </WalletStack.Navigator>
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
      <Tabs.Screen name="Wallet" component={WalletStackScreens} options={{ title: "Wallet" }} />
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
        <RootStack.Screen name="CalendarPicker" component={CalendarPickerScreen} />
        <RootStack.Screen name="RouteOptions" component={RouteOptionsScreen} />
        <RootStack.Screen name="EmergencySOS" component={EmergencySOSScreen} />
      </RootStack.Navigator>
    </NavigationIndependentTree>
  );
}
