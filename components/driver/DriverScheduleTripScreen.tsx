import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { ApiError } from "../../services/api/client";
import { listRoutes, type CatalogRoute } from "../../services/api/routes";
import { scheduleTrip } from "../../services/api/trips";

type DriverScheduleTripScreenProps = {
  onBack?: () => void;
  onScheduled?: () => void;
};

type RouteOption = {
  catalogDocId: string;
  routeId: string;
  name: string;
  defaultOrigin: string;
  defaultDestination: string;
  busOptions: string[];
};

function mapCatalogToOption(cat: CatalogRoute): RouteOption {
  const safe = cat.routeId.replace(/[^\w.-]/g, "_");
  return {
    catalogDocId: cat.id,
    routeId: cat.routeId,
    name: cat.routeName || `${cat.origin} → ${cat.destination}`,
    defaultOrigin: cat.origin,
    defaultDestination: cat.destination,
    busOptions: [`BUS-${safe}`, `BUS-${safe}-2`, `BUS-${safe}-3`],
  };
}

const DEFAULT_DATE = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 10);
const DEFAULT_TIME = new Date(Date.now() + 30 * 60 * 1000).toTimeString().slice(0, 5);

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toHmLocal(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseDateTimeLocal(dateStr: string, timeStr: string): Date {
  const combined = combineDateTime(dateStr, timeStr);
  if (Number.isNaN(combined.getTime())) {
    return new Date(Date.now() + 30 * 60 * 1000);
  }
  return combined;
}

function formatDateLabel(ymd: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!y || !mo || !d) return ymd;
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString("en-LK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(hm: string): string {
  const [h, m] = hm.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hm;
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function DriverScheduleTripScreen({
  onBack,
  onScheduled,
}: DriverScheduleTripScreenProps) {
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [selectedBus, setSelectedBus] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [dateValue, setDateValue] = useState(DEFAULT_DATE);
  const [timeValue, setTimeValue] = useState(DEFAULT_TIME);
  const [seatsAvailable, setSeatsAvailable] = useState("45");
  const [baseFare, setBaseFare] = useState("150");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [iosPicker, setIosPicker] = useState<"date" | "time" | null>(null);

  const departureAsDate = useMemo(
    () => parseDateTimeLocal(dateValue, timeValue),
    [dateValue, timeValue]
  );

  const openAndroidDatePicker = () => {
    DateTimePickerAndroid.open({
      value: departureAsDate,
      mode: "date",
      minimumDate: new Date(new Date().setHours(0, 0, 0, 0)),
      onChange: (event, date) => {
        if (event.type === "set" && date) {
          setDateValue(toYmdLocal(date));
        }
      },
    });
  };

  const openAndroidTimePicker = () => {
    DateTimePickerAndroid.open({
      value: departureAsDate,
      mode: "time",
      is24Hour: true,
      onChange: (event, date) => {
        if (event.type === "set" && date) {
          setTimeValue(toHmLocal(date));
        }
      },
    });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { items } = await listRoutes({ limit: 120 });
        if (!mounted) return;
        const opts = items.map(mapCatalogToOption);
        setRouteOptions(opts);
        if (opts.length) {
          const first = opts[0];
          setSelectedCatalogId((prev) => (opts.some((o) => o.catalogDocId === prev) ? prev : first.catalogDocId));
        }
      } catch {
        if (mounted) setErrorMessage("Could not load routes from the server.");
      } finally {
        if (mounted) setRoutesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedRoute = useMemo(() => {
    return routeOptions.find((r) => r.catalogDocId === selectedCatalogId) ?? routeOptions[0];
  }, [routeOptions, selectedCatalogId]);

  useEffect(() => {
    if (!selectedRoute) return;
    setOrigin(selectedRoute.defaultOrigin);
    setDestination(selectedRoute.defaultDestination);
    setSelectedBus(selectedRoute.busOptions[0]);
  }, [selectedCatalogId, selectedRoute]);

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
    setSelectedCatalogId(route.catalogDocId);
    setOrigin(route.defaultOrigin);
    setDestination(route.defaultDestination);
    setSelectedBus(route.busOptions[0]);
  };

  const validateForm = () => {
    if (!selectedRoute || !selectedBus || !origin.trim() || !destination.trim() || !dateValue.trim() || !timeValue.trim()) {
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
        routeCode: selectedRoute.routeId,
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
        {routesLoading ? (
          <View style={styles.routesLoading}>
            <ActivityIndicator color="#8AC2FF" />
            <Text style={styles.routesLoadingText}>Loading Sri Lankan route catalog…</Text>
          </View>
        ) : null}
        {!routesLoading && routeOptions.length === 0 ? (
          <Text style={styles.inlineError}>No routes in Firestore. Run npm run seed in the backend.</Text>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {routeOptions.map((route) => {
            const active = route.catalogDocId === selectedCatalogId;
            return (
              <Pressable
                key={route.catalogDocId}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => onSelectRoute(route)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {route.routeId}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.routePreview}>{selectedRoute?.name ?? "—"}</Text>

        <Text style={styles.sectionTitle}>Departure Date and Time</Text>
        <Text style={styles.hint}>Tap to open calendar or clock. Quick chips adjust date or time.</Text>

        <Pressable
          style={styles.pickerRow}
          onPress={() => {
            if (Platform.OS === "android") openAndroidDatePicker();
            else setIosPicker("date");
          }}
        >
          <View style={styles.pickerRowIcon}>
            <Ionicons name="calendar-outline" size={22} color="#8AC2FF" />
          </View>
          <View style={styles.pickerRowBody}>
            <Text style={styles.pickerRowLabel}>Departure date</Text>
            <Text style={styles.pickerRowValue}>{formatDateLabel(dateValue)}</Text>
            <Text style={styles.pickerRowSub}>{dateValue}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#7F96AD" />
        </Pressable>

        <Pressable
          style={styles.pickerRow}
          onPress={() => {
            if (Platform.OS === "android") openAndroidTimePicker();
            else setIosPicker("time");
          }}
        >
          <View style={styles.pickerRowIcon}>
            <Ionicons name="time-outline" size={22} color="#8AC2FF" />
          </View>
          <View style={styles.pickerRowBody}>
            <Text style={styles.pickerRowLabel}>Departure time</Text>
            <Text style={styles.pickerRowValue}>{formatTimeLabel(timeValue)}</Text>
            <Text style={styles.pickerRowSub}>{`${timeValue} (24h)`}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#7F96AD" />
        </Pressable>

        {Platform.OS === "ios" && iosPicker ? (
          <Modal transparent animationType="slide" visible onRequestClose={() => setIosPicker(null)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIosPicker(null)} />
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{iosPicker === "date" ? "Pick date" : "Pick time"}</Text>
                <Pressable onPress={() => setIosPicker(null)} hitSlop={12}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={departureAsDate}
                mode={iosPicker}
                display={iosPicker === "date" ? "inline" : "spinner"}
                minimumDate={iosPicker === "date" ? new Date(new Date().setHours(0, 0, 0, 0)) : undefined}
                themeVariant="dark"
                onChange={(_e, date) => {
                  if (!date) return;
                  if (iosPicker === "date") setDateValue(toYmdLocal(date));
                  else setTimeValue(toHmLocal(date));
                }}
              />
            </View>
          </Modal>
        ) : null}

        <Text style={styles.quickSectionLabel}>Quick dates</Text>
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
        <Text style={styles.quickSectionLabel}>Quick times</Text>
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
          {(selectedRoute?.busOptions ?? []).map((bus) => (
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
            placeholder="150"
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
  routesLoading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  routesLoadingText: { color: "#97ACC1", fontSize: 13 },
  inlineError: { color: "#FF8A8A", marginBottom: 10, fontWeight: "600" },
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
  hint: {
    color: "#8FA6BC",
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 17,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2B3E52",
    backgroundColor: "#151E2A",
  },
  pickerRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1A2A3D",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRowBody: { flex: 1 },
  pickerRowLabel: { color: "#8FA6BC", fontSize: 11, fontWeight: "700", letterSpacing: 0.3, marginBottom: 2 },
  pickerRowValue: { color: "#EAF2FC", fontSize: 17, fontWeight: "800" },
  pickerRowSub: { color: "#7F96AD", fontSize: 12, marginTop: 2, fontWeight: "600" },
  quickSectionLabel: { color: "#AFC2D5", fontSize: 12, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#121A24",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: "#243549",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#243549",
  },
  modalTitle: { color: "#EAF2FC", fontSize: 17, fontWeight: "800" },
  modalDone: { color: "#66AEF2", fontSize: 16, fontWeight: "800" },
});
