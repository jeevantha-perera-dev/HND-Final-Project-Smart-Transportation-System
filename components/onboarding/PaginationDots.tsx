import React from "react";
import { Animated, StyleSheet, View } from "react-native";

type Props = {
  count: number;
  scrollX: Animated.Value;
  width: number;
};

export default function PaginationDots({ count, scrollX, width }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.35, 1, 0.35],
          extrapolate: "clamp",
        });
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: "clamp",
        });

        return <Animated.View key={index} style={[styles.dot, { opacity, width: dotWidth }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 22 },
  dot: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "#3B82F6",
    marginHorizontal: 4,
  },
});
