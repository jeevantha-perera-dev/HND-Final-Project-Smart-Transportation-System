import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../theme";
import { PrimaryButton } from "../ui";
import { PassengerRootStackParamList } from "../types";
import PassengerBottomNav from "../PassengerBottomNav";

type Props = NativeStackScreenProps<PassengerRootStackParamList, "RateTrip">;

const tags = ["Clean Bus", "Smooth Ride", "Punctual", "Great Driving", "Helpful Staff"];

export default function RateTripScreen({ navigation }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color="#D8E8FB" />
            </Pressable>
            <Text style={styles.title}>Rate Your Trip</Text>
            <View style={{ width: 20 }} />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.routePill}>
                <Ionicons name="bus-outline" size={12} color="#9BC9FF" />
                <Text style={styles.routePillText}>Route 42B</Text>
              </View>
              <Text style={styles.completed}>Completed 15m ago</Text>
            </View>
            <Text style={styles.routeTitle}>Downtown Express</Text>
            <Text style={styles.stopText}>Grand Central Terminal - Departed 08:30 AM</Text>
            <Text style={styles.stopText}>Oakwood Business Park - Arrived 09:15 AM</Text>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.driverLabel}>Your Driver</Text>
                <Text style={styles.driverName}>Captain Marcus Reid</Text>
              </View>
              <View style={styles.certPill}>
                <Text style={styles.certText}>Gold Certified</Text>
              </View>
            </View>
          </View>

          <Text style={styles.feedbackTitle}>How was your journey?</Text>
          <Text style={styles.feedbackSub}>Your feedback helps us improve TransitFlow</Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Ionicons name={rating >= star ? "star" : "star-outline"} size={36} color="#60A5FA" />
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Additional Comments</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            style={styles.input}
            placeholder="Was the bus clean? Was the driver punctual?"
            placeholderTextColor="#8093AA"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>QUICK TAGS</Text>
          <View style={styles.tagsWrap}>
            {tags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={({ pressed }) => [styles.tag, active && styles.tagActive, pressed && styles.pressed]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton title="Submit Feedback" icon="checkmark-circle-outline" onPress={() => navigation.goBack()} />
        </ScrollView>
        <PassengerBottomNav active="Trips" />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  gradient: { flex: 1 },
  content: { padding: spacing.page, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: "800" },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: "#10325B",
    borderColor: "#1F548D",
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  routePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0C2746", borderRadius: 999, padding: 6 },
  routePillText: { color: "#A7CCF7", fontWeight: "700", fontSize: 11 },
  completed: { color: "#C3DCF8", fontSize: 11, fontWeight: "700" },
  routeTitle: { color: "#EFF7FF", fontSize: 26, fontWeight: "800", marginBottom: 6 },
  stopText: { color: "#C7DCF5", fontSize: 13, lineHeight: 18, marginBottom: 3 },
  driverRow: { marginTop: 10, borderTopColor: "#2D5D91", borderTopWidth: 1, paddingTop: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  driverAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#2D5A89" },
  driverLabel: { color: "#8CB4DF", fontSize: 11, fontWeight: "700" },
  driverName: { color: "#F2F8FF", fontSize: 16, fontWeight: "800" },
  certPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#264B75" },
  certText: { color: "#C9E3FF", fontSize: 10, fontWeight: "700" },
  feedbackTitle: { color: "#E9F2FE", fontSize: 32, fontWeight: "800", textAlign: "center" },
  feedbackSub: { color: "#A6B7CD", fontSize: 14, textAlign: "center", marginTop: 4, marginBottom: 10 },
  starRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  inputLabel: { color: "#C9D8E8", fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: {
    minHeight: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#233448",
    backgroundColor: "#121E2B",
    color: "#E8F3FF",
    padding: 12,
    marginBottom: 14,
  },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tag: {
    borderRadius: 999,
    backgroundColor: "#27313F",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagActive: { backgroundColor: "#1D4ED8" },
  tagText: { color: "#D6E4F6", fontSize: 12, fontWeight: "700" },
  tagTextActive: { color: "#EFF7FF" },
  pressed: { opacity: 0.8 },
});
