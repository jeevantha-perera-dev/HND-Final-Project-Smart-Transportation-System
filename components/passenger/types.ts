import { NavigatorScreenParams } from "@react-navigation/native";
import { Place, BusResult } from "../../types/bus";

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
  AvailableBuses:
    | {
        from?: string;
        to?: string;
        fromPlace?: Place;
        toPlace?: Place;
        /** `YYYY-MM-DD` from route search; filters trips to that travel day (Colombo). */
        travelDateKey?: string;
        initialResults?: BusResult[];
        initialError?: string | null;
      }
    | undefined;
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
  QRTicket: { bookingId?: string } | undefined;
  RateTrip: undefined;
  LiveTracking: undefined;
  CalendarPicker: { selectedDate?: string } | undefined;
  RouteOptions: undefined;
  EmergencySOS: undefined;
};
