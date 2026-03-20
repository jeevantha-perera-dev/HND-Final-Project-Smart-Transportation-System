import React, { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "./theme";

type SectionHeaderProps = {
  title: string;
  actionText?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, actionText, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionText ? (
        <Pressable onPress={onActionPress}>
          <Text style={styles.sectionAction}>{actionText}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type TabSwitcherProps<T extends string> = {
  options: readonly T[];
  active: T;
  onChange: (value: T) => void;
};

export function TabSwitcher<T extends string>({ options, active, onChange }: TabSwitcherProps<T>) {
  return (
    <View style={styles.switchWrap}>
      {options.map((option) => {
        const isActive = option === active;
        return (
          <Pressable
            key={option}
            style={({ pressed }) => [styles.switchItem, isActive && styles.switchItemActive, pressed && styles.pressed]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.switchText, isActive && styles.switchTextActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function PrimaryButton({ title, onPress, icon }: PrimaryButtonProps) {
  return (
    <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={onPress}>
      {icon ? <Ionicons name={icon} size={16} color="#041120" /> : null}
      <Text style={styles.primaryButtonText}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color="#041120" />
    </Pressable>
  );
}

type TripCardProps = {
  route: string;
  status: "Live Now" | "Upcoming" | "In Progress";
  from: string;
  to: string;
  date: string;
  time: string;
  seat: string;
  bus: string;
  onViewQr: () => void;
};

export function TripCard({ route, status, from, to, date, time, seat, bus, onViewQr }: TripCardProps) {
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripTopRow}>
        <View style={styles.routePill}>
          <Ionicons name="bus-outline" size={12} color={colors.blueSoft} />
          <Text style={styles.routePillText}>{route}</Text>
        </View>
        <View style={[styles.statusPill, status === "Live Now" ? styles.statusLive : styles.statusUpcoming]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.lineWrap}>
        <View style={styles.dotLine}>
          <View style={styles.dot} />
          <View style={styles.dotConnector} />
          <View style={styles.dot} />
        </View>
        <View style={styles.routeTextWrap}>
          <Text style={styles.label}>FROM</Text>
          <Text style={styles.location}>{from}</Text>
          <Text style={[styles.label, styles.toLabel]}>TO</Text>
          <Text style={styles.location}>{to}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <MetaItem icon="calendar-outline" text={date} />
        <MetaItem icon="time-outline" text={time} />
      </View>
      <View style={styles.metaRow}>
        <MetaItem icon="card-outline" text={seat} />
        <MetaItem icon="bus-outline" text={bus} />
      </View>

      <PrimaryButton title="View QR Ticket" icon="qr-code-outline" onPress={onViewQr} />
    </View>
  );
}

type CompletedTripCardProps = {
  route: string;
  from: string;
  to: string;
  date: string;
  time: string;
  seat: string;
  bus: string;
  onRate: () => void;
};

export function CompletedTripCard({ route, from, to, date, time, seat, bus, onRate }: CompletedTripCardProps) {
  return (
    <View style={styles.tripCard}>
      <View style={styles.tripTopRow}>
        <View style={styles.routePill}>
          <Ionicons name="bus-outline" size={12} color={colors.blueSoft} />
          <Text style={styles.routePillText}>{route}</Text>
        </View>
        <View style={styles.statusCompleted}>
          <Text style={styles.statusText}>Completed</Text>
        </View>
      </View>
      <View style={styles.lineWrap}>
        <View style={styles.dotLine}>
          <View style={styles.dot} />
          <View style={styles.dotConnector} />
          <View style={styles.dot} />
        </View>
        <View style={styles.routeTextWrap}>
          <Text style={styles.label}>FROM</Text>
          <Text style={styles.location}>{from}</Text>
          <Text style={[styles.label, styles.toLabel]}>TO</Text>
          <Text style={styles.location}>{to}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <MetaItem icon="calendar-outline" text={date} />
        <MetaItem icon="time-outline" text={time} />
      </View>
      <View style={styles.metaRow}>
        <MetaItem icon="card-outline" text={seat} />
        <MetaItem icon="bus-outline" text={bus} />
      </View>
      <PrimaryButton title="Rate This Trip" icon="star-outline" onPress={onRate} />
    </View>
  );
}

function MetaItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

type NotificationCardProps = {
  title: string;
  body: string;
  time: string;
  type: "default" | "important";
  icon: keyof typeof Ionicons.glyphMap;
};

export function NotificationCard({ title, body, time, type, icon }: NotificationCardProps) {
  const important = type === "important";
  return (
    <View style={[styles.notificationCard, important && styles.notificationImportant]}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTimeRow}>
          <View style={[styles.notificationIconWrap, important && styles.notificationIconImportant]}>
            <Ionicons name={icon} size={14} color={important ? "#93C5FD" : "#7E92AB"} />
          </View>
          <Text style={styles.notificationTime}>{time}</Text>
        </View>
        {important ? <View style={styles.importantDot} /> : null}
      </View>
      <Text style={styles.notificationTitle}>{title}</Text>
      <Text style={styles.notificationBody}>{body}</Text>
    </View>
  );
}

export function ScreenCard({ children }: { children: ReactNode }) {
  return <View style={styles.screenCard}>{children}</View>;
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { color: "#C8D6E7", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  sectionAction: { color: colors.blueSoft, fontSize: 12, fontWeight: "700" },
  switchWrap: { flexDirection: "row", gap: 8, marginBottom: 16 },
  switchItem: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#121B28",
    borderWidth: 1,
    borderColor: "#1C293C",
  },
  switchItemActive: { backgroundColor: "#14335D", borderColor: "#26599D" },
  switchText: { color: "#A2B3C7", fontWeight: "700", fontSize: 12 },
  switchTextActive: { color: "#D9EBFF" },
  primaryButton: {
    marginTop: 10,
    borderRadius: 10,
    height: 38,
    backgroundColor: "#60A5FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  primaryButtonText: { color: "#041120", fontWeight: "800", fontSize: 14 },
  tripCard: {
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  tripTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  routePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#12243B",
  },
  routePillText: { color: colors.blueSoft, fontSize: 11, fontWeight: "700" },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusLive: { backgroundColor: "#1D4ED8" },
  statusUpcoming: { backgroundColor: "#1E3A8A" },
  statusCompleted: { backgroundColor: "#1E3A8A", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: "#DBEAFF", fontSize: 11, fontWeight: "700" },
  lineWrap: { flexDirection: "row", gap: 10, marginBottom: 10 },
  dotLine: { alignItems: "center", marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#60A5FA" },
  dotConnector: { width: 1.5, height: 30, backgroundColor: "#2E4E73", marginVertical: 4 },
  routeTextWrap: { flex: 1 },
  label: { color: "#7F91A7", fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  toLabel: { marginTop: 8 },
  location: { color: "#EAF2FF", fontSize: 17, fontWeight: "700", lineHeight: 20 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "48%" },
  metaText: { color: "#BCCBE0", fontSize: 12, fontWeight: "600" },
  notificationCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.cardSecondary,
    borderWidth: 1,
    borderColor: "#1C2838",
  },
  notificationImportant: {
    backgroundColor: "#0F335E",
    borderColor: "#1C5AA0",
  },
  notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  notificationTimeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  notificationIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#192638",
  },
  notificationIconImportant: { backgroundColor: "#0E3C72" },
  notificationTime: { color: "#93A5BD", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  importantDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.blueSoft },
  notificationTitle: { color: "#F1F7FF", fontSize: 17, fontWeight: "800", marginTop: 8, marginBottom: 4 },
  notificationBody: { color: "#A8BAD0", fontSize: 13, lineHeight: 18 },
  screenCard: {
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  pressed: { opacity: 0.8 },
});
