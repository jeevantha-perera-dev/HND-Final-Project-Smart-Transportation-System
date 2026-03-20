import { NavigatorScreenParams } from "@react-navigation/native";

export type PassengerTabsParamList = {
  Home: undefined;
  Trips: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type PassengerRootStackParamList = {
  MainTabs: NavigatorScreenParams<PassengerTabsParamList> | undefined;
  QRTicket: undefined;
  RateTrip: undefined;
  LiveTracking: undefined;
};
