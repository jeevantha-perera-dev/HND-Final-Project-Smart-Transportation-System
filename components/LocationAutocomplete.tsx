import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
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
};

export default function LocationAutocomplete({ placeholder, value, onChange, onSelect, iconType }: Props) {
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

  const iconColor = iconType === "destination" ? "#D46363" : "#4A9EFF";
  const showDropdown = open && (suggestions.length > 0 || Boolean(error) || isLoading) && value.trim().length >= 2;

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
    <View style={styles.wrap}>
      <View style={styles.inputWrap}>
        <Ionicons name="location-outline" size={16} color={iconColor} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor="#7C93AE"
          style={styles.input}
          accessibilityRole="search"
        />
        {isLoading ? <ActivityIndicator size="small" color="#4A9EFF" /> : null}
      </View>

      {showDropdown ? (
        <View style={styles.dropdown} accessibilityRole="menu">
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={suggestions}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const active = index === activeIndex;
              return (
                <Pressable
                  onPress={() => select(item)}
                  onHoverIn={() => setActiveIndex(index)}
                  style={[styles.row, active && styles.rowActive]}
                >
                  <Ionicons name="location" size={15} color={iconColor} style={styles.rowIcon} />
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.primaryText}>{highlight(item.name, value)}</Text>
                    <Text style={styles.secondaryText} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              !isLoading ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>{error ?? "No results found"}</Text>
                </View>
              ) : null
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const re = new RegExp(`(${escapeRegex(q)})`, "ig");
  const parts = text.split(re);
  return (
    <Text>
      {parts.map((part, index) => (
        <Text key={`${part}-${index}`} style={part.toLowerCase() === q.toLowerCase() ? styles.matchText : undefined}>
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
  input: { flex: 1, color: "#DFECF9", fontSize: 16, fontWeight: "700" },
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
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#273B50",
  },
  rowActive: { backgroundColor: "#1E3A5F" },
  rowIcon: { marginRight: 8 },
  rowTextWrap: { flex: 1 },
  primaryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  secondaryText: { color: "#9CB3CC", fontSize: 12, marginTop: 2 },
  matchText: { color: "#4A9EFF", fontWeight: "900" },
  emptyWrap: { paddingHorizontal: 12, paddingVertical: 12 },
  emptyText: { color: "#A6BCD0", fontSize: 12 },
});
