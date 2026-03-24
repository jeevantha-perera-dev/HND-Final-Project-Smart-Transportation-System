import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PassengerHomeStackParamList } from "../types";

type Props = NativeStackScreenProps<PassengerHomeStackParamList, "Favorites">;

const favorites = [
  { id: "f1", label: "Home -> Campus", info: "Daily commute", route: "Route 42" },
  { id: "f2", label: "Campus -> Station", info: "Evening return", route: "Blue Line" },
  { id: "f3", label: "Airport -> City", info: "Weekend travel", route: "19A Express" },
];

export default function FavoritesScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color="#EAF4FF" />
          </Pressable>
          <Text style={styles.title}>Favorites</Text>
          <View style={styles.iconBtn} />
        </View>

        {favorites.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Ionicons name="star" size={14} color="#F5C447" />
            </View>
            <Text style={styles.cardSub}>{item.info}</Text>
            <Text style={styles.cardRoute}>{item.route}</Text>
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
  card: { borderRadius: 14, borderWidth: 1, borderColor: "#223246", backgroundColor: "#101A27", padding: 14, marginBottom: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: "#EAF4FF", fontSize: 16, fontWeight: "800" },
  cardSub: { color: "#8EA3BA", fontSize: 12, marginTop: 4 },
  cardRoute: { color: "#5EB3F6", fontSize: 13, fontWeight: "800", marginTop: 8 },
});
