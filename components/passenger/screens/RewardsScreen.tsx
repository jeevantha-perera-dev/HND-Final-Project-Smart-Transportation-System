import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerWalletStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerWalletStackParamList, "Rewards">;

const rewards = [
  { id: "r1", title: "Free Weekly Pass", progress: 85, target: "Complete 3 more rides" },
  { id: "r2", title: "Cashback Booster", progress: 40, target: "Spend $30 more this month" },
  { id: "r3", title: "Night Owl Badge", progress: 65, target: "Take 2 late-night rides" },
];

export default function RewardsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Rewards</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>TransitFlow Points</Text>
          <Text style={styles.pointsValue}>1,240 pts</Text>
          <Text style={styles.pointsHint}>You can redeem points for tickets and vouchers.</Text>
        </View>

        {rewards.map((item) => (
          <View key={item.id} style={styles.rewardCard}>
            <View style={styles.rewardTop}>
              <Text style={styles.rewardTitle}>{item.title}</Text>
              <Text style={styles.rewardProgress}>{`${item.progress}%`}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${item.progress}%` }]} />
            </View>
            <Text style={styles.rewardHint}>{item.target}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#05090F" },
  content: { padding: 16, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#EAF4FF", fontSize: 20, fontWeight: "800" },
  pointsCard: { borderRadius: 16, borderWidth: 1, borderColor: "#2E4E6E", backgroundColor: "#10253D", padding: 14, marginBottom: 14 },
  pointsLabel: { color: "#A8C8E7", fontSize: 12, fontWeight: "700" },
  pointsValue: { color: "#EAF5FF", fontSize: 30, fontWeight: "900", marginTop: 4 },
  pointsHint: { color: "#95B2CF", fontSize: 12, marginTop: 4 },
  rewardCard: { borderRadius: 14, borderWidth: 1, borderColor: "#24364A", backgroundColor: "#101A27", padding: 14, marginBottom: 10 },
  rewardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  rewardTitle: { color: "#EAF4FF", fontSize: 16, fontWeight: "800" },
  rewardProgress: { color: "#5EB3F6", fontSize: 14, fontWeight: "800" },
  track: { height: 6, borderRadius: 4, backgroundColor: "#24384D", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4, backgroundColor: "#5EB3F6" },
  rewardHint: { color: "#8EA3BA", fontSize: 12, marginTop: 8 },
});
