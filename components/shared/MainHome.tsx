import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserRole } from "../auth/LoginScreen";
import SettingsScreen from "./SettingsScreen";

type MainTab = "home" | "map" | "wallet" | "alerts" | "profile";

type MainHomeProps = {
  role: UserRole;
};

export default function MainHome({ role }: MainHomeProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const userLabel = role === "driver" ? "Driver" : "Passenger";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>
          {showSettings ? "Settings" : `${userLabel} Workspace`}
        </Text>
        <View style={styles.topActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setShowMenu((prev) => !prev)}
          >
            <Ionicons name="menu-outline" size={18} color="#D4E7FF" />
          </Pressable>
          <View style={styles.avatarDotWrap}>
            <View style={styles.avatarDot} />
          </View>
        </View>
      </View>

      {showMenu ? (
        <View style={styles.menuCard}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowSettings(true);
              setActiveTab("profile");
              setShowMenu(false);
            }}
          >
            <Ionicons name="settings-outline" size={16} color="#9AC6FF" />
            <Text style={styles.menuText}>Settings</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.body}>
        {showSettings ? (
          <SettingsScreen
            onTabPress={(tab) => {
              setShowSettings(false);
              setActiveTab(tab);
            }}
          />
        ) : (
          <ProfileShell
            activeTab={activeTab}
            role={role}
            onOpenSettings={() => {
              setActiveTab("profile");
              setShowSettings(true);
            }}
            onTabPress={setActiveTab}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

type ProfileShellProps = {
  role: UserRole;
  activeTab: MainTab;
  onOpenSettings: () => void;
  onTabPress: (tab: MainTab) => void;
};

function ProfileShell({
  role,
  activeTab,
  onOpenSettings,
  onTabPress,
}: ProfileShellProps) {
  return (
    <View style={styles.profileWrapper}>
      <View style={styles.placeholderContent}>
        <Text style={styles.placeholderTitle}>
          {activeTab === "profile"
            ? `${role === "driver" ? "Driver" : "Passenger"} Profile`
            : activeTab.toUpperCase()}
        </Text>
        <Text style={styles.placeholderBody}>
          {activeTab === "profile"
            ? "Tap Settings to open your account configuration screen."
            : "Feature module placeholder."}
        </Text>
        {activeTab === "profile" ? (
          <Pressable style={styles.settingsCta} onPress={onOpenSettings}>
            <Ionicons name="settings-outline" size={17} color="#DDEBFF" />
            <Text style={styles.settingsCtaText}>Open Settings</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.tabBar}>
        <ShellTab
          icon="home-outline"
          label="Home"
          active={activeTab === "home"}
          onPress={() => onTabPress("home")}
        />
        <ShellTab
          icon="map-outline"
          label="Map"
          active={activeTab === "map"}
          onPress={() => onTabPress("map")}
        />
        <ShellTab
          icon="wallet-outline"
          label="Wallet"
          active={activeTab === "wallet"}
          onPress={() => onTabPress("wallet")}
        />
        <ShellTab
          icon="notifications-outline"
          label="Alerts"
          active={activeTab === "alerts"}
          onPress={() => onTabPress("alerts")}
        />
        <ShellTab
          icon="person"
          label="Profile"
          active={activeTab === "profile"}
          onPress={() => onTabPress("profile")}
        />
      </View>
    </View>
  );
}

type ShellTabProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
};

function ShellTab({ icon, label, active, onPress }: ShellTabProps) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? "#4FA2FF" : "#7D91A8"} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#071523" },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#0B1522",
    borderBottomWidth: 1,
    borderColor: "#1B2B3D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topTitle: { color: "#EAF4FF", fontSize: 17, fontWeight: "700" },
  topActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#18283C",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarDotWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1E3046",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4FD37A",
  },
  menuCard: {
    position: "absolute",
    top: 60,
    right: 16,
    zIndex: 10,
    backgroundColor: "#122132",
    borderColor: "#223449",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  menuText: { color: "#D5E8FF", fontWeight: "600" },
  body: { flex: 1 },
  profileWrapper: {
    flex: 1,
    backgroundColor: "#091322",
    justifyContent: "space-between",
  },
  placeholderContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  placeholderTitle: {
    color: "#F1F8FF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  placeholderBody: {
    color: "#9FB4CB",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  settingsCta: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2D4158",
    backgroundColor: "#142237",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingsCtaText: { color: "#DDEBFF", fontWeight: "600" },
  tabBar: {
    height: 68,
    borderTopWidth: 1,
    borderColor: "#1A2A3B",
    backgroundColor: "#0A121E",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabButton: { alignItems: "center", gap: 2 },
  tabLabel: { color: "#7D91A8", fontSize: 11, fontWeight: "600" },
  tabLabelActive: { color: "#4FA2FF" },
});
