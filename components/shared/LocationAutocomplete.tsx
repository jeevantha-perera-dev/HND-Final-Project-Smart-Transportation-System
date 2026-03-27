import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LocationSuggestion, resolveSuggestionDetails, useLocationSuggestions } from "../../services/location/useLocationSuggestions";

type Props = {
  placeholder?: string;
  value: string;
  onChange: (text: string) => void;
  onSelect: (place: LocationSuggestion) => void;
  iconType: "origin" | "destination";
};

export default function LocationAutocomplete({ placeholder, value, onChange, onSelect, iconType }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { suggestions, isLoading, error } = useLocationSuggestions(value, "lk");
  const showDropdown = isFocused && value.trim().length >= 2;

  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: showDropdown ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [opacity, showDropdown]);

  useEffect(() => {
    setActiveIndex(suggestions.length ? 0 : -1);
  }, [suggestions.length]);

  const iconColor = iconType === "destination" ? "#D46363" : "#4877AA";
  const inputWebA11y = useMemo(
    () =>
      (Platform.OS === "web"
        ? {
            "aria-autocomplete": "list",
            "aria-expanded": showDropdown,
            "aria-activedescendant":
              activeIndex >= 0 && suggestions[activeIndex] ? `location-option-${suggestions[activeIndex].place_id}` : undefined,
          }
        : {}) as Record<string, unknown>,
    [showDropdown, activeIndex, suggestions]
  );

  async function selectSuggestion(suggestion: LocationSuggestion) {
    const resolved = await resolveSuggestionDetails(suggestion);
    onChange(resolved.primaryText);
    onSelect(resolved);
    setIsFocused(false);
  }

  function onKeyPress(event: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    if (!showDropdown || !suggestions.length) return;
    const key = event.nativeEvent.key;
    if (key === "ArrowDown") {
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }
    if (key === "ArrowUp") {
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return;
    }
    if (key === "Enter") {
      const selected = suggestions[Math.max(0, activeIndex)];
      if (selected) void selectSuggestion(selected);
      return;
    }
    if (key === "Escape") {
      setIsFocused(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <Ionicons name="location-outline" size={16} color={iconColor} />
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 120)}
          onKeyPress={onKeyPress}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#7C93AE"
          accessibilityRole="search"
          {...(inputWebA11y as never)}
        />
        {isLoading ? <ActivityIndicator size="small" color="#4A9EFF" /> : null}
      </View>

      {showDropdown ? (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity,
              transform: [
                {
                  translateY: opacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
            },
          ]}
          accessibilityRole="menu"
          {...((Platform.OS === "web" ? { role: "listbox" } : {}) as never)}
        >
          {suggestions.map((item, index) => {
            const active = index === activeIndex;
            return (
              <Pressable
                key={`${item.place_id}-${index}`}
                onPress={() => void selectSuggestion(item)}
                onHoverIn={() => setActiveIndex(index)}
                style={[styles.row, active && styles.rowActive]}
                accessibilityRole="button"
                {...((Platform.OS === "web"
                  ? {
                      role: "option",
                      id: `location-option-${item.place_id}`,
                      "aria-selected": active,
                    }
                  : {}) as never)}
              >
                <Ionicons name="location" size={16} color="#4A9EFF" style={styles.rowIcon} />
                <View style={styles.rowBody}>
                  <Text style={styles.primaryText}>{highlight(item.primaryText, value)}</Text>
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {!isLoading && suggestions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{error ?? "No locations found"}</Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

function highlight(text: string, query: string) {
  const clean = query.trim();
  if (!clean) return text;
  const regex = new RegExp(`(${escapeRegex(clean)})`, "ig");
  const parts = text.split(regex);
  return (
    <Text>
      {parts.map((part, idx) => {
        const isMatch = part.toLowerCase() === clean.toLowerCase();
        return (
          <Text key={`${part}-${idx}`} style={isMatch ? styles.highlightText : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 20,
  },
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
  input: {
    flex: 1,
    color: "#DFECF9",
    fontSize: 16,
    fontWeight: "700",
  },
  dropdown: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: "#1A2B3C",
    borderRadius: 14,
    borderTopWidth: 1,
    borderTopColor: "#29425D",
    borderWidth: 1,
    borderColor: "#22384E",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#22384E",
  },
  rowActive: {
    backgroundColor: "#1E3A5F",
  },
  rowIcon: {
    marginRight: 8,
  },
  rowBody: {
    flex: 1,
  },
  primaryText: {
    color: "#EAF3FF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryText: {
    color: "#9FB2C7",
    fontSize: 12,
    marginTop: 2,
  },
  highlightText: {
    color: "#4A9EFF",
    fontWeight: "900",
  },
  emptyWrap: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyText: {
    color: "#9FB2C7",
    fontSize: 12,
  },
});
