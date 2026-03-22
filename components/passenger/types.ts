import { NavigatorScreenParams } from "@react-navigation/native";

export type PassengerTabsParamList = {
  Home: undefined;
  Trips: undefined;
  Wallet: undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type PassengerHomeStackParamList = {
  HomeMain: undefined;
  RouteSearch: undefined;
  AvailableBuses: { from?: string; to?: string } | undefined;
};

export type PassengerRootStackParamList = {
  MainTabs: NavigatorScreenParams<PassengerTabsParamList> | undefined;
  QRTicket: undefined;
  RateTrip: undefined;
  LiveTracking: undefined;
};
