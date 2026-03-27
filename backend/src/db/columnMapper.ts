import { FieldValue } from "firebase-admin/firestore";

export type RouteDocument = {
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  frequency: string;
  busType: string;
  operatorName: string;
  isExpress: boolean;
  isAC: boolean;
  distanceKm: number;
  durationMinutes: number;
  stops: string[];
  daysOfOperation: string[];
  createdAt: FieldValue;
  updatedAt: FieldValue;
  sourceRow: number;
};

export type FareDocument = {
  fareId: string;
  routeId: string;
  origin: string;
  destination: string;
  fareAmount: number;
  currency: string;
  busType: string;
  passengerType: string;
  createdAt: FieldValue;
  updatedAt: FieldValue;
  sourceRow: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function createGetters(row: Record<string, string>) {
  const keys = Object.keys(row);

  const get = (aliases: string[]) => {
    for (const alias of aliases) {
      const target = normalize(alias);
      const found = keys.find((key) => normalize(key) === target || normalize(key).includes(target));
      if (found && row[found]?.trim()) return row[found].trim();
    }
    return "";
  };

  const getNum = (aliases: string[]) => {
    const raw = get(aliases);
    const parsed = Number.parseFloat(raw.replace(/[^0-9.]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getBool = (aliases: string[], trueValues: string[] = ["yes", "true", "1", "ac", "express"]) => {
    const raw = get(aliases).toLowerCase();
    if (!raw) return false;
    return trueValues.some((token) => raw.includes(token.toLowerCase()));
  };

  const getArray = (aliases: string[]) => {
    const raw = get(aliases);
    if (!raw) return [];
    return raw
      .split(/[|,;]/g)
      .map((part) => part.trim())
      .filter(Boolean);
  };

  return { get, getNum, getBool, getArray };
}

function parseClockMinutes(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
}

function inferDurationMinutes(rawDuration: string, departureTime: string, arrivalTime: string) {
  const durationNum = Number.parseFloat(rawDuration.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(durationNum) && durationNum > 0) return durationNum;

  const dep = parseClockMinutes(departureTime);
  const arr = parseClockMinutes(arrivalTime);
  if (!dep || !arr) return 0;
  const delta = arr >= dep ? arr - dep : arr + 24 * 60 - dep;
  return delta > 0 ? delta : 0;
}

export function mapRouteRow(row: Record<string, string>, rowIndex: number): RouteDocument {
  const { get, getNum, getBool, getArray } = createGetters(row);

  const busType = get(["BusType", "Type", "Class", "ServiceType", "Category"]);
  const departureTime = get(["DepartureTime", "Departure", "Time", "StartTime", "DepTime", "Departure Time"]);
  const arrivalTime = get(["ArrivalTime", "Arrival", "EndTime", "ArrTime", "Arrival Time"]);
  const rawDuration = get(["Duration", "DurationMins", "TravelTime", "Minutes"]);

  return {
    routeId: get(["RouteNo", "Route_No", "RouteID", "route_number", "Route", "RouteNumber", "Route Number"]),
    routeName: get(["RouteName", "Route_Name", "Description", "Name", "Title", "Route Name"]),
    origin: get(["Origin", "From", "StartPoint", "Start", "BoardingPoint", "Source"]),
    destination: get(["Destination", "To", "EndPoint", "End", "AlightingPoint", "Target"]),
    departureTime,
    arrivalTime,
    frequency: get(["Frequency", "FrequencyMins", "Interval", "FreqMins"]),
    busType,
    operatorName: get(["Operator", "OperatorName", "Company", "ServiceProvider", "Bus Operator"]),
    isExpress: getBool(["Express", "IsExpress", "BusType", "Type", "Route Number"], ["express", "ex"]),
    isAC: getBool(["AC", "IsAC", "AirConditioned", "BusType", "Type"], ["ac", "air"]),
    distanceKm: getNum(["Distance", "DistanceKm", "Km", "KM", "TotalDistance", "Distance (km)"]),
    durationMinutes: inferDurationMinutes(rawDuration, departureTime, arrivalTime),
    stops: getArray(["Stops", "StopsList", "RouteStops", "StopsOnRoute"]),
    daysOfOperation: getArray(["Days", "OperatingDays", "DaysOfService", "Schedule"]),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    sourceRow: rowIndex,
  };
}

export function mapFareRow(row: Record<string, string>, rowIndex: number): FareDocument {
  const { get, getNum } = createGetters(row);

  return {
    fareId: get(["FareID", "Fare_ID", "ID", "Id"]),
    routeId: get(["RouteNo", "RouteID", "Route_No", "RouteNumber", "Route", "Route Number"]),
    origin: get(["Origin", "From", "BoardingPoint", "Start", "Source"]),
    destination: get(["Destination", "To", "AlightingPoint", "End", "Target"]),
    fareAmount: getNum(["Fare", "FareAmount", "Amount", "Price", "Cost", "LKR", "Toll Fee / Fare (Rs.)"]),
    currency: "LKR",
    busType: get(["BusType", "Type", "Class", "ServiceType"]),
    passengerType: get(["PassengerType", "Passenger", "Type", "Category"]) || "Adult",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    sourceRow: rowIndex,
  };
}
