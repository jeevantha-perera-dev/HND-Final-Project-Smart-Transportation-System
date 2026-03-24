import { NavigatorScreenParams } from "@react-navigation/native";

export type PassengerTabsParamList = {
  Home: undefined;
  Trips: undefined;
  Wallet: NavigatorScreenParams<PassengerWalletStackParamList> | undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type PassengerHomeStackParamList = {
  HomeMain: undefined;
  RouteSearch: { selectedDate?: string } | undefined;
  AvailableBuses: { from?: string; to?: string } | undefined;
  SeatSelection: { tripId?: string; busId: string; routeName: string; price: string };
  Checkout: {
    tripId?: string;
    busId: string;
    routeName: string;
    price: string;
    seatId: string;
    fromStop?: string;
    toStop?: string;
  };
  HomeBusesList: undefined;
  NearestStops: undefined;
  Favorites: undefined;
  ExpressRoutes: undefined;
  NearbyStops: undefined;
  HomeInsights: { focus?: "updates" | "topup" } | undefined;
};

export type PassengerWalletStackParamList = {
  WalletMain: undefined;
  AddMoney: undefined;
  Transfer: undefined;
  Vouchers: undefined;
  Rewards: undefined;
  WalletHistory: undefined;
  WalletStatement: undefined;
};

export type PassengerRootStackParamList = {
  MainTabs: NavigatorScreenParams<PassengerTabsParamList> | undefined;
  QRTicket: undefined;
  RateTrip: undefined;
  LiveTracking: undefined;
  CalendarPicker: { selectedDate?: string } | undefined;
  RouteOptions: undefined;
  EmergencySOS: undefined;
};
