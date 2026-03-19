import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function DriverPerformanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance</Text>
      <Text style={styles.subtitle}>
        Driver analytics and weekly stats will appear here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071523",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#F4F8FC",
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "#A7B5C3",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
