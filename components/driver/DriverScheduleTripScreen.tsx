import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "../../services/api/client";
import { scheduleTrip } from "../../services/api/trips";

type DriverScheduleTripScreenProps = {
  onBack?: () => void;
  onScheduled?: () => void;
};

type RouteOption = {
  id: string;
  name: string;
  defaultOrigin: string;
  defaultDestination: string;
  busOptions: string[];
};

const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: "R-402",
    name: "Route 402 - Express",
    defaultOrigin: "Downtown Terminal",
    defaultDestination: "Northside Tech Park",
    busOptions: ["BUS-9920", "BUS-9152", "BUS-6612"],
  },
  {
    id: "R-115",
    name: "Route 115 - Tech Park Loop",
    defaultOrigin: "City Bus Center",
    defaultDestination: "Tech Park Main Gate",
    busOptions: ["BUS-7714", "BUS-8024", "BUS-8822"],
  },
  {
    id: "R-089",
    name: "Route 089 - Airport Connector",
    defaultOrigin: "Central Station",
    defaultDestination: "Airport Transit Hub",
    busOptions: ["BUS-6612", "BUS-9054", "BUS-1173"],
  },
];

const DEFAULT_DATE = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 10);
const DEFAULT_TIME = new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5);

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export default function DriverScheduleTripScreen({
  onBack,
  onScheduled,
}: DriverScheduleTripScreenProps) {
  const [selectedRouteId, setSelectedRouteId] = useState(ROUTE_OPTIONS[0].id);
  const [selectedBus, setSelectedBus] = useState(ROUTE_OPTIONS[0].busOptions[0]);
  const [origin, setOrigin] = useState(ROUTE_OPTIONS[0].defaultOrigin);
  const [destination, setDestination] = useState(ROUTE_OPTIONS[0].defaultDestination);
  const [dateValue, setDateValue] = useState(DEFAULT_DATE);
  const [timeValue, setTimeValue] = useState(DEFAULT_TIME);
  const [seatsAvailable, setSeatsAvailable] = useState("45");
  const [baseFare, setBaseFare] = useState("2.5");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedRoute = useMemo(
    () => ROUTE_OPTIONS.find((route) => route.id === selectedRouteId) ?? ROUTE_OPTIONS[0],
    [selectedRouteId]
  );

  const quickDateOptions = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    for (let offset = 0; offset < 3; offset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const value = date.toISOString().slice(0, 10);
      items.push({
        value,
        label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      });
    }
    return items;
  }, []);

  const quickTimeOptions = ["06:30", "08:00", "10:00", "14:30", "18:00"];

  const onSelectRoute = (route: RouteOption) => {
    setSelectedRouteId(route.id);
    setOrigin(route.defaultOrigin);
    setDestination(route.defaultDestination);
    setSelectedBus(route.busOptions[0]);
  };

  const validateForm = () => {
    if (!selectedRouteId || !selectedBus || !origin.trim() || !destination.trim() || !dateValue.trim() || !timeValue.trim()) {
      return "Please fill all required fields before scheduling.";
    }

    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return "Start and destination cannot be the same location.";
    }

    const departure = combineDateTime(dateValue.trim(), timeValue.trim());
    if (Number.isNaN(departure.getTime())) {
      return "Please enter a valid date and time.";
    }

    if (departure.getTime() <= Date.now()) {
      return "Scheduled departure must be in the future.";
    }

    const seats = Number(seatsAvailable);
    if (!Number.isFinite(seats) || seats < 1) {
      return "Seats available must be at least 1.";
    }

    const fare = Number(baseFare);
    if (!Number.isFinite(fare) || fare < 0) {
      return "Base fare must be a valid positive amount.";
    }

    return null;
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const departureAt = combineDateTime(dateValue.trim(), timeValue.trim());
    const arrivalAt = new Date(departureAt.getTime() + 45 * 60 * 1000);

    setSubmitting(true);
    try {
      await scheduleTrip({
        routeCode: selectedRoute.id,
        routeName: selectedRoute.name,
        vehicleCode: selectedBus,
        originStopName: origin.trim(),
        destinationStopName: destination.trim(),
        departureAt: departureAt.toISOString(),
        arrivalAt: arrivalAt.toISOString(),
        seatsAvailable: Number(seatsAvailable),
        baseFare: Number(baseFare),
        notes: notes.trim() || undefined,
      });
      setSuccessMessage("Trip scheduled successfully. You can start it from your dashboard.");
      setNotes("");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Failed to schedule trip. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color="#E2EDF8" />
        </Pressable>
        <Text style={styles.headerTitle}>Schedule a Trip</Text>
      </View>
      <View style={styles.separator} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Select Route</Text>
        <View style={styles.chipRow}>
          {ROUTE_OPTIONS.map((route) => {
            const active = route.id === selectedRouteId;
            return (
              <Pressable
                key={route.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelectRoute(route)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{route.id}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.routePreview}>{selectedRoute.name}</Text>

        <Text style={styles.sectionTitle}>Departure Date and Time</Text>
        <View style={styles.quickRow}>
          {quickDateOptions.map((item) => (
            <Pressable
              key={item.value}
              style={[styles.quickChip, dateValue === item.value && styles.quickChipActive]}
              onPress={() => setDateValue(item.value)}
            >
              <Text style={[styles.quickChipText, dateValue === item.value && styles.quickChipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.formRow}>
          <Field
            label="Date (YYYY-MM-DD)"
            value={dateValue}
            onChangeText={setDateValue}
            placeholder="2026-03-28"
          />
          <Field
            label="Time (HH:mm)"
            value={timeValue}
            onChangeText={setTimeValue}
            placeholder="08:30"
          />
        </View>
        <View style={styles.quickRow}>
          {quickTimeOptions.map((time) => (
            <Pressable
              key={time}
              style={[styles.quickChip, timeValue === time && styles.quickChipActive]}
              onPress={() => setTimeValue(time)}
            >
              <Text style={[styles.quickChipText, timeValue === time && styles.quickChipTextActive]}>
                {time}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Vehicle</Text>
        <View style={styles.chipRow}>
          {selectedRoute.busOptions.map((bus) => (
            <Pressable
              key={bus}
              style={[styles.chip, selectedBus === bus && styles.chipActive]}
              onPress={() => setSelectedBus(bus)}
            >
              <Text style={[styles.chipText, selectedBus === bus && styles.chipTextActive]}>{bus}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Trip Details</Text>
        <Field label="Trip Start" value={origin} onChangeText={setOrigin} placeholder="Start terminal" />
        <Field
          label="Destination"
          value={destination}
          onChangeText={setDestination}
          placeholder="Drop destination"
        />
        <View style={styles.formRow}>
          <Field
            label="Seats Available"
            value={seatsAvailable}
            onChangeText={setSeatsAvailable}
            placeholder="45"
            keyboardType="numeric"
          />
          <Field
            label="Base Fare"
            value={baseFare}
            onChangeText={setBaseFare}
            placeholder="2.5"
            keyboardType="decimal-pad"
          />
        </View>
        <Field
          label="Notes (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any trip notes for dispatch"
          multiline
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        {successMessage && onScheduled ? (
          <Pressable style={styles.doneBtn} onPress={onScheduled}>
            <Text style={styles.doneBtnText}>Back to Dashboard</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cancelBtn} onPress={onBack}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#1B3652" />
          ) : (
            <Text style={styles.submitText}>Create Schedule</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#7F96AD"
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A121D" },
  header: { height: 54, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#EAF2FC", fontSize: 22, fontWeight: "800", marginLeft: 6 },
  separator: { height: 1, backgroundColor: "#1E2D3F" },
  content: { padding: 14, paddingBottom: 24 },
  sectionTitle: { color: "#DBE6F2", fontSize: 15, fontWeight: "800", marginTop: 8, marginBottom: 8 },
  routePreview: {
    color: "#C5DBEF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#315170",
    backgroundColor: "#151E2A",
    paddingHorizontal: 12,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "#123D6B",
    borderColor: "#3D77AE",
  },
  chipText: {
    color: "#97ACC1",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#DDF0FF",
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2D4055",
    paddingHorizontal: 10,
    height: 30,
    justifyContent: "center",
    backgroundColor: "#131B26",
  },
  quickChipActive: {
    backgroundColor: "#1D4C7F",
    borderColor: "#5A97D1",
  },
  quickChipText: {
    color: "#A5BAD0",
    fontSize: 12,
    fontWeight: "600",
  },
  quickChipTextActive: {
    color: "#E8F4FF",
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
  },
  fieldWrap: {
    flex: 1,
    marginBottom: 10,
  },
  fieldLabel: {
    color: "#AFC2D5",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  fieldInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2B3E52",
    backgroundColor: "#171F2A",
    color: "#E8F1FB",
    fontSize: 14,
    paddingHorizontal: 12,
  },
  fieldInputMultiline: {
    minHeight: 76,
    height: 76,
    textAlignVertical: "top",
    paddingTop: 10,
  },
  errorText: {
    color: "#FF9AA5",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  successText: {
    color: "#8FE6B0",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  doneBtn: {
    marginTop: 10,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2F6DA3",
    backgroundColor: "#103457",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    color: "#D5EBFF",
    fontSize: 13,
    fontWeight: "800",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#1D2B3D",
    padding: 14,
    backgroundColor: "#0A121D",
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2E435A",
    backgroundColor: "#171F2B",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    color: "#B6C8DA",
    fontSize: 15,
    fontWeight: "700",
  },
  submitBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#66AEF2",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.75,
  },
  submitText: {
    color: "#1B3652",
    fontSize: 15,
    fontWeight: "800",
  },
});
