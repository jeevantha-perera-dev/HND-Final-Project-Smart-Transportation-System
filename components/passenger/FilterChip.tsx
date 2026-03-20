import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type FilterChipProps = {
  label: string;
  active?: boolean;
  removable?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  style?: ViewStyle;
};

export default function FilterChip({
  label,
  active = false,
  removable = false,
  onPress,
  onRemove,
  style,
}: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        style,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {removable ? (
        <Pressable hitSlop={8} onPress={onRemove}>
          <Ionicons
            name="close-circle"
            size={16}
            color={active ? "#EAF4FF" : "#95A8C0"}
          />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#274364",
    backgroundColor: "#122236",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipActive: {
    backgroundColor: "#1F5FAC",
    borderColor: "#3E7ECF",
  },
  label: {
    color: "#B7CBE3",
    fontSize: 11,
    fontWeight: "700",
  },
  labelActive: {
    color: "#EAF4FF",
  },
  pressed: { opacity: 0.82 },
});
