import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { searchPlaces } from "../services/locationService";
import { Place } from "../types/bus";

type Props = {
  placeholder: string;
  value: string;
  onChange: (text: string) => void;
  onSelect: (place: Place) => void;
  iconType: "origin" | "destination";
  /** Compact dark styling for driver Manage Seats walk-in drop-off (same search as passenger). */
  variant?: "default" | "driver";
};

export default function LocationAutocomplete({
  placeholder,
  value,
  onChange,
  onSelect,
  iconType,
  variant = "default",
}: Props) {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const query = value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchPlaces(query);
        setSuggestions(data);
        if (!data.length) setError("No results found");
      } catch {
        setSuggestions([]);
        setError("No results found");
      } finally {
        setIsLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    setActiveIndex(suggestions.length ? 0 : -1);
  }, [suggestions.length]);

  const isDriver = variant === "driver";
  const iconColor = iconType === "destination" ? "#D46363" : "#4A9EFF";
  const showDropdown = open && (suggestions.length > 0 || Boolean(error) || isLoading) && value.trim().length >= 2;
  const spinnerColor = isDriver ? "#65AEF3" : "#4A9EFF";

  const select = (place: Place) => {
    onChange(place.name);
    onSelect(place);
    setOpen(false);
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (!showDropdown) return;
    const key = event.nativeEvent.key;
    if (key === "ArrowDown") {
      setActiveIndex((prev) => (prev + 1) % Math.max(1, suggestions.length));
      return;
    }
    if (key === "ArrowUp") {
      setActiveIndex((prev) => (prev <= 0 ? Math.max(0, suggestions.length - 1) : prev - 1));
      return;
    }
    if (key === "Enter") {
      const item = suggestions[Math.max(0, activeIndex)];
      if (item) select(item);
      return;
    }
    if (key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <View style={[styles.wrap, isDriver && styles.wrapDriver]}>
      <View style={[styles.inputWrap, isDriver && styles.inputWrapDriver]}>
        <Ionicons name="location-outline" size={isDriver ? 18 : 16} color={iconColor} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor={isDriver ? "#5C6B7A" : "#7C93AE"}
          style={[styles.input, isDriver && styles.inputDriver]}
          accessibilityRole="search"
        />
        {isLoading ? <ActivityIndicator size="small" color={spinnerColor} /> : null}
      </View>

      {showDropdown ? (
        <View style={[styles.dropdown, isDriver && styles.dropdownDriver]} accessibilityRole="menu">
          {/*
            ScrollView + map (not FlatList): avoids "VirtualizedLists nested in ScrollView" when this
            component is used inside Driver Manage Seats and other scrollable screens. Results are
            capped at ~7 by searchPlaces, so virtualization is unnecessary.
          */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator={suggestions.length > 4}
          >
            {suggestions.map((item, index) => {
              const active = index === activeIndex;
              return (
                <Pressable
                  key={`${item.id}-${index}`}
                  onPress={() => select(item)}
                  onHoverIn={() => setActiveIndex(index)}
                  style={[
                    styles.row,
                    isDriver && styles.rowDriver,
                    active && (isDriver ? styles.rowActiveDriver : styles.rowActive),
                  ]}
                >
                  <Ionicons name="location" size={15} color={iconColor} style={styles.rowIcon} />
                  <View style={styles.rowTextWrap}>
                    <Text style={[styles.primaryText, isDriver && styles.primaryTextDriver]}>
                      {highlight(item.name, value, variant)}
                    </Text>
                    <Text
                      style={[styles.secondaryText, isDriver && styles.secondaryTextDriver]}
                      numberOfLines={1}
                    >
                      {item.displayName}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            {!isLoading && suggestions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, isDriver && styles.emptyTextDriver]}>
                  {error ?? "No results found"}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function highlight(text: string, query: string, variant: "default" | "driver" = "default") {
  const q = query.trim();
  if (!q) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, "ig");
  const parts = text.split(re);
  const matchStyle = variant === "driver" ? styles.matchTextDriver : styles.matchText;
  return (
    <Text>
      {parts.map((part, index) => (
        <Text key={`${part}-${index}`} style={part.toLowerCase() === q.toLowerCase() ? matchStyle : undefined}>
          {part}
        </Text>
      ))}
    </Text>
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const styles = StyleSheet.create({
  wrap: { position: "relative", zIndex: 999 },
  wrapDriver: { zIndex: 5000, elevation: 24 },
  inputWrap: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E2E42",
    backgroundColor: "#101A28",
    paddingHorizontal: 14,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapDriver: {
    height: 48,
    borderRadius: 10,
    borderColor: "#37506D",
    backgroundColor: "#151D28",
    paddingHorizontal: 12,
  },
  input: { flex: 1, color: "#DFECF9", fontSize: 16, fontWeight: "700" },
  inputDriver: { color: "#E8F0FA", fontSize: 14, fontWeight: "600" },
  dropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: "#1A2635",
    borderRadius: 14,
    borderTopWidth: 1,
    borderTopColor: "#2A3F55",
    borderWidth: 1,
    borderColor: "#2A3F55",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
    maxHeight: 240,
  },
  dropdownDriver: {
    top: 52,
    backgroundColor: "#1A222E",
    borderColor: "#37506D",
    borderTopColor: "#37506D",
    borderRadius: 10,
    maxHeight: 220,
    elevation: 16,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#273B50",
  },
  rowDriver: { borderBottomColor: "#2A3544" },
  rowActive: { backgroundColor: "#1E3A5F" },
  rowActiveDriver: { backgroundColor: "#22364D" },
  rowIcon: { marginRight: 8 },
  rowTextWrap: { flex: 1 },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  primaryTextDriver: { color: "#E8F0FA", fontWeight: "700", fontSize: 13 },
  secondaryText: { color: "#9CB3CC", fontSize: 12, marginTop: 2 },
  secondaryTextDriver: { color: "#8FA9C4", fontSize: 11 },
  matchText: { color: "#4A9EFF", fontWeight: "900" },
  matchTextDriver: { color: "#65AEF3", fontWeight: "800" },
  emptyWrap: { paddingHorizontal: 12, paddingVertical: 12 },
  emptyText: { color: "#A6BCD0", fontSize: 12 },
  emptyTextDriver: { color: "#8FA9C4", fontSize: 12 },
});
