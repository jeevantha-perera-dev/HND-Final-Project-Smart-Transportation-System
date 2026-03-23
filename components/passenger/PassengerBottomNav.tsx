import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { PassengerRootStackParamList, PassengerTabsParamList } from "./types";
import { colors } from "./theme";

type TabKey = keyof PassengerTabsParamList;

type Props = {
  active: TabKey;
};

export default function PassengerBottomNav({ active }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<PassengerRootStackParamList>>();

  const goToTab = (tab: TabKey) => {
    navigation.navigate("MainTabs", { screen: tab });
  };

  return (
    <View style={styles.tabBar}>
      <TabButton icon="home-outline" label="Home" active={active === "Home"} onPress={() => goToTab("Home")} />
      <TabButton icon="list-outline" label="Trips" active={active === "Trips"} onPress={() => goToTab("Trips")} />
      <TabButton icon="wallet-outline" label="Wallet" active={active === "Wallet"} onPress={() => goToTab("Wallet")} />
      <TabButton
        icon="notifications-outline"
        label="Alerts"
        active={active === "Alerts"}
        onPress={() => goToTab("Alerts")}
      />
      <TabButton icon="person-outline" label="Profile" active={active === "Profile"} onPress={() => goToTab("Profile")} />
    </View>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? colors.blue : "#7F90A6"} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 66,
    backgroundColor: "#0A121E",
    borderTopColor: "#1B2A3A",
    borderTopWidth: 1,
    paddingBottom: 4,
    paddingTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  tabLabel: {
    color: "#7F90A6",
    fontSize: 11,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: colors.blue,
  },
  pressed: { opacity: 0.8 },
});
