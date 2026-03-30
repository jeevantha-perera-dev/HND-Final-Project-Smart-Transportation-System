import { Feather, Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  InteractionManager,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateProfile } from "firebase/auth";
import { getAuthProfile, updateAuthProfile } from "../../services/api/auth";
import { ApiError } from "../../services/api/client";
import { getSession, setSession, type AppUser } from "../../services/api/session";
import { auth } from "../../services/firebase/client";
import { deleteProfileAvatar, uploadProfileAvatar } from "../../services/firebase/profilePhoto";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type SettingsScreenProps = {
  onTabPress?: (tab: "home" | "map" | "wallet" | "alerts" | "profile") => void;
  onLogout?: () => void;
  /**
   * When embedded inside other shells (e.g., driver dashboard),
   * we can hide the 5-tab bar to avoid visual duplication.
   */
  showBottomTabs?: boolean;
};

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

type SettingsItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  hideChevron?: boolean;
};

type ToggleItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

type CardContainerProps = {
  children: ReactNode;
  gradient?: boolean;
};

const languages = ["English (US)", "Spanish (ES)", "French (FR)", "Hindi (IN)"];

function formatMemberSince(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase() || "?";
}

export default function ProfileAndSettingsScreen({
  onTabPress,
  onLogout,
  showBottomTabs = true,
}: SettingsScreenProps) {
  const [profile, setProfile] = useState<AppUser | null>(() => getSession().user);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  const [highContrast, setHighContrast] = useState(false);
  const [voiceAssistant, setVoiceAssistant] = useState(true);
  const [screenReader, setScreenReader] = useState(false);
  const [fontSize, setFontSize] = useState(0.45);
  const [showLanguages, setShowLanguages] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);

  const applyProfile = useCallback((next: AppUser) => {
    setProfile(next);
    setEditFullName(next.fullName ?? "");
    setEditPhone(typeof next.phone === "string" ? next.phone : "");
    const cur = getSession();
    setSession({
      accessToken: cur.accessToken,
      refreshToken: cur.refreshToken,
      user: next,
    });
  }, []);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const next = await getAuthProfile();
      applyProfile(next);
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : "Could not load profile.");
      const fallback = getSession().user;
      if (fallback) applyProfile(fallback);
      else setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const saveAccount = useCallback(async () => {
    const fullName = editFullName.trim();
    if (fullName.length < 2) {
      Alert.alert("Check name", "Please enter your full name (at least 2 characters).");
      return;
    }
    const phoneTrimmed = editPhone.trim();
    setSaving(true);
    try {
      const next = await updateAuthProfile({
        fullName,
        phone: phoneTrimmed === "" ? null : phoneTrimmed,
      });
      applyProfile(next);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }
      Alert.alert(
        "Saved",
        phoneTrimmed
          ? "Your name and phone number were saved to your account."
          : "Your profile was updated. Phone number removed from your account."
      );
      setShowEditProfile(false);
    } catch (e) {
      Alert.alert(
        "Could not save",
        e instanceof ApiError ? e.message : "Something went wrong. Try again."
      );
    } finally {
      setSaving(false);
    }
  }, [applyProfile, editFullName, editPhone]);

  const openPhoneEditor = useCallback(() => {
    if (!profile) {
      Alert.alert("Sign in", "Sign in to add or change your phone number.");
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowEditProfile(true);
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => phoneInputRef.current?.focus(), 120);
    });
  }, [profile]);

  const uploadPickedImage = useCallback(
    async (uid: string, localUri: string) => {
      setPhotoUploading(true);
      try {
        const url = await uploadProfileAvatar(uid, localUri);
        const next = await updateAuthProfile({ photoUrl: url });
        applyProfile(next);
        Alert.alert("Saved", "Your picture was updated.");
      } catch (e) {
        Alert.alert(
          "Could not update photo",
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not upload your picture. Try again."
        );
      } finally {
        setPhotoUploading(false);
      }
    },
    [applyProfile]
  );

  const removePhoto = useCallback(
    async (uid: string) => {
      setPhotoUploading(true);
      try {
        await deleteProfileAvatar(uid);
        const next = await updateAuthProfile({ photoUrl: null });
        applyProfile(next);
        Alert.alert("Saved", "Your picture was removed.");
      } catch (e) {
        Alert.alert(
          "Could not remove photo",
          e instanceof ApiError ? e.message : "Something went wrong. Try again."
        );
      } finally {
        setPhotoUploading(false);
      }
    },
    [applyProfile]
  );

  const pickFromLibrary = useCallback(
    async (uid: string) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow photo library access to choose a profile picture.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      await uploadPickedImage(uid, result.assets[0].uri);
    },
    [uploadPickedImage]
  );

  const pickFromCamera = useCallback(
    async (uid: string) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow camera access to take a profile picture.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      await uploadPickedImage(uid, result.assets[0].uri);
    },
    [uploadPickedImage]
  );

  const openPhotoOptions = useCallback(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Sign in required", "Sign in to change your profile photo.");
      return;
    }
    const hasPhoto = Boolean(profile?.photoUrl?.trim());
    Alert.alert("Profile photo", "Choose an option", [
      { text: "Photo library", onPress: () => void pickFromLibrary(uid) },
      { text: "Camera", onPress: () => void pickFromCamera(uid) },
      ...(hasPhoto
        ? ([
            {
              text: "Remove photo",
              style: "destructive" as const,
              onPress: () => void removePhoto(uid),
            },
          ] as const)
        : []),
      { text: "Cancel", style: "cancel" },
    ]);
  }, [pickFromCamera, pickFromLibrary, profile?.photoUrl, removePhoto]);

  const displayName = profile?.fullName?.trim() || "Passenger";
  const displayEmail = profile?.email?.trim() || "—";
  const photoUri = profile?.photoUrl?.trim() || "";

  const languageRows = useMemo(
    () =>
      languages.map((language) => (
        <Pressable
          key={language}
          style={({ pressed }) => [
            styles.languageRow,
            pressed && styles.pressed,
          ]}
          onPress={() => setSelectedLanguage(language)}
        >
          <Text
            style={[
              styles.languageText,
              selectedLanguage === language && styles.languageSelected,
            ]}
          >
            {language}
          </Text>
          <View
            style={[
              styles.radio,
              selectedLanguage === language && styles.radioActive,
            ]}
          >
            {selectedLanguage === language ? (
              <View style={styles.radioInner} />
            ) : null}
          </View>
        </Pressable>
      )),
    [selectedLanguage],
  );

  const toggleLanguageDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowLanguages((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={["#0A1730", "#04060D"]} style={styles.background}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            !showBottomTabs && styles.contentNoTabs,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>Account Settings</Text>

          <View style={styles.profileSection}>
            {profileLoading ? (
              <ActivityIndicator color="#7EB4F0" style={{ marginVertical: 24 }} />
            ) : (
              <>
                <View style={styles.avatarWrap}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.avatar} resizeMode="cover" />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitials}>{initialsFromName(displayName)}</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.editBadge}
                    onPress={openPhotoOptions}
                    disabled={photoUploading || !profile}
                  >
                    {photoUploading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Feather name="edit-2" color="#FFFFFF" size={12} />
                    )}
                  </Pressable>
                </View>
                <Text style={styles.name}>{profile ? displayName : "Not signed in"}</Text>
                <Text style={styles.email}>{profile ? displayEmail : "Sign in to sync your account from Firebase."}</Text>
                {profileError ? (
                  <Pressable onPress={() => void loadProfile()} style={styles.profileErrorBanner}>
                    <Text style={styles.profileErrorText}>{profileError} · Tap to retry</Text>
                  </Pressable>
                ) : null}
                {profile ? (
                  <>
                    <Pressable
                      style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setShowEditProfile((v) => !v);
                      }}
                    >
                      <Text style={styles.editButtonText}>
                        {showEditProfile ? "Close editor" : "Edit profile info"}
                      </Text>
                    </Pressable>
                    {showEditProfile ? (
                      <View style={styles.editForm}>
                        <Text style={styles.editLabel}>Full name</Text>
                        <TextInput
                          value={editFullName}
                          onChangeText={setEditFullName}
                          placeholder="Your name"
                          placeholderTextColor="#6B7C92"
                          style={styles.editInput}
                          autoCapitalize="words"
                        />
                        <Text style={styles.editLabel}>Phone number</Text>
                        <TextInput
                          ref={phoneInputRef}
                          value={editPhone}
                          onChangeText={setEditPhone}
                          placeholder="e.g. +94 77 123 4567"
                          placeholderTextColor="#6B7C92"
                          style={styles.editInput}
                          keyboardType="phone-pad"
                          textContentType="telephoneNumber"
                          autoComplete="tel"
                        />
                        <Pressable
                          style={({ pressed }) => [styles.saveProfileBtn, pressed && styles.pressed]}
                          onPress={() => void saveAccount()}
                          disabled={saving}
                        >
                          {saving ? (
                            <ActivityIndicator color="#041120" />
                          ) : (
                            <Text style={styles.saveProfileBtnText}>Save</Text>
                          )}
                        </Pressable>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </>
            )}
          </View>

          <SettingsSection title="ACCOUNT">
            <CardContainer gradient>
              <SettingsItem
                icon="mail-outline"
                title="Email"
                subtitle={profile?.email?.trim() || "—"}
                hideChevron
              />
              <View style={styles.cardDivider} />
              <SettingsItem
                icon="call-outline"
                title="Phone number"
                subtitle={
                  profile?.phone?.trim()
                    ? `${profile.phone.trim()} · Tap to change`
                    : profile
                      ? "Tap to add your mobile number"
                      : "—"
                }
                onPress={profile ? openPhoneEditor : undefined}
                hideChevron={!profile}
              />
              <View style={styles.cardDivider} />
              <SettingsItem
                icon="person-badge-outline"
                title="Role"
                subtitle={
                  profile?.role === "DRIVER"
                    ? "Driver"
                    : profile?.role === "ADMIN"
                      ? "Admin"
                      : profile
                        ? "Passenger"
                        : "—"
                }
                hideChevron
              />
              <View style={styles.cardDivider} />
              <SettingsItem
                icon="calendar-outline"
                title="Member since"
                subtitle={formatMemberSince(profile?.createdAt)}
                hideChevron
              />
            </CardContainer>
          </SettingsSection>

          <SettingsSection title="VISUAL EXPERIENCE">
            <CardContainer>
              <View style={styles.fontSizeTopRow}>
                <View style={styles.itemIconWrap}>
                  <Ionicons name="text-outline" size={16} color="#9BC4FF" />
                </View>
                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemTitle}>Font Size</Text>
                  <Text style={styles.itemSubtitle}>
                    Adjust text size for better readability across the entire
                    app.
                  </Text>
                </View>
              </View>
              <View style={styles.sliderRow}>
                <Text style={styles.aSmall}>A</Text>
                <Slider
                  style={styles.slider}
                  value={fontSize}
                  onValueChange={setFontSize}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor="#70B3FF"
                  maximumTrackTintColor="#1E324B"
                  thumbTintColor="#B7D7FF"
                />
                <Text style={styles.aLarge}>A</Text>
              </View>
              <View style={styles.cardDivider} />
              <ToggleItem
                icon="contrast-outline"
                title="High Contrast"
                description="Increase color distinction between elements for better legibility."
                value={highContrast}
                onValueChange={setHighContrast}
              />
            </CardContainer>
          </SettingsSection>

          <SettingsSection title="INTERACTION & AUDIO">
            <CardContainer>
              <ToggleItem
                icon="volume-high-outline"
                title="Voice Assistant"
                description="Hear audio descriptions for routes, bus arrivals, and navigation steps."
                value={voiceAssistant}
                onValueChange={setVoiceAssistant}
              />
              <View style={styles.cardDivider} />
              <ToggleItem
                icon="eye-outline"
                title="Screen Reader Optim."
                description="Enhanced labels for external screen reading apps (TalkBack/VoiceOver)."
                value={screenReader}
                onValueChange={setScreenReader}
              />
            </CardContainer>
          </SettingsSection>

          <SettingsSection title="LANGUAGE & REGION">
            <CardContainer gradient>
              <Pressable
                style={({ pressed }) => [
                  styles.languageHeader,
                  pressed && styles.pressed,
                ]}
                onPress={toggleLanguageDropdown}
              >
                <View style={styles.languageHeaderLeft}>
                  <View style={styles.itemIconWrap}>
                    <Ionicons
                      name="language-outline"
                      size={16}
                      color="#B8D5FF"
                    />
                  </View>
                  <View>
                    <Text style={styles.itemTitle}>Preferred Language</Text>
                    <Text style={styles.itemSubtitle}>{selectedLanguage}</Text>
                  </View>
                </View>
                <Ionicons
                  name={showLanguages ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#CFE4FF"
                />
              </Pressable>
              {showLanguages ? (
                <View style={styles.languageList}>{languageRows}</View>
              ) : null}
            </CardContainer>
          </SettingsSection>

          <View style={styles.infoBox}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color="#79AFFF"
              />
            </View>
            <Text style={styles.infoText}>
              These settings help us make your TransitFlow experience more
              comfortable. Changes are applied instantly and synced across
              devices.
            </Text>
          </View>

          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              if (onLogout) {
                onLogout();
                return;
              }
              Alert.alert("Logout", "Use your app’s sign-out flow from the main login experience.");
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#F2A9B8" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </ScrollView>

        {showBottomTabs ? (
          <View style={styles.tabBar}>
            <BottomTab
              icon="home-outline"
              label="Home"
              active={false}
              onPress={() => onTabPress?.("home")}
            />
            <BottomTab
              icon="map-outline"
              label="Map"
              active={false}
              onPress={() => onTabPress?.("map")}
            />
            <BottomTab
              icon="wallet-outline"
              label="Wallet"
              active={false}
              onPress={() => onTabPress?.("wallet")}
            />
            <BottomTab
              icon="notifications-outline"
              label="Alerts"
              active={false}
              onPress={() => onTabPress?.("alerts")}
            />
            <BottomTab
              icon="person"
              label="Profile"
              active
              onPress={() => onTabPress?.("profile")}
            />
          </View>
        ) : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {children}
    </View>
  );
}

function SettingsItem({ icon, title, subtitle, onPress, hideChevron }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsItem, pressed && onPress && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.itemIconWrap}>
        <Ionicons name={icon} size={16} color="#AFD2FF" />
      </View>
      <View style={styles.itemTextWrap}>
        <Text style={styles.itemTitle}>{title}</Text>
        {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
      </View>
      {!hideChevron ? <Ionicons name="chevron-forward" size={18} color="#B9D7FF" /> : <View style={{ width: 18 }} />}
    </Pressable>
  );
}

function ToggleItem({
  icon,
  title,
  description,
  value,
  onValueChange,
}: ToggleItemProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.itemIconWrap}>
        <Ionicons name={icon} size={16} color="#9BC4FF" />
      </View>
      <View style={styles.itemTextWrap}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemSubtitle}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: "#4A5D72", true: "#4C9EFF" }}
        thumbColor={value ? "#EAF4FF" : "#CCD4DC"}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

function CardContainer({ children, gradient = false }: CardContainerProps) {
  if (!gradient) {
    return <View style={styles.cardBase}>{children}</View>;
  }

  return (
    <LinearGradient
      colors={["#5FA8F8", "#3A7FD8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardBase}
    >
      {children}
    </LinearGradient>
  );
}

type BottomTabProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress?: () => void;
};

function BottomTab({ icon, label, active, onPress }: BottomTabProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.bottomTab, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={active ? "#4FA2FF" : "#7D91A8"} />
      <Text style={[styles.bottomLabel, active && styles.bottomLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#060A13" },
  background: { flex: 1 },
  content: { paddingHorizontal: 18, paddingBottom: 24 },
  // Extra space so the content never tucks under an external bottom bar.
  contentNoTabs: { paddingBottom: 120 },
  headerTitle: {
    marginTop: 4,
    color: "#F2F7FF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 18,
  },
  profileSection: { alignItems: "center", marginBottom: 20 },
  avatarWrap: { width: 84, height: 84, marginBottom: 10 },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  avatarPlaceholder: {
    backgroundColor: "#1E3A5F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#EAF4FF", fontSize: 28, fontWeight: "800" },
  profileErrorBanner: {
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#2A1518",
    borderWidth: 1,
    borderColor: "#5C2A32",
  },
  profileErrorText: { color: "#FCA5A5", fontSize: 12, textAlign: "center" },
  editForm: {
    marginTop: 14,
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
  },
  editLabel: { color: "#9EB4CB", fontSize: 11, fontWeight: "700", marginBottom: 6, marginTop: 8 },
  editInput: {
    borderWidth: 1,
    borderColor: "#2B3D55",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F2F8FF",
    fontSize: 15,
    backgroundColor: "#0D1A2A",
  },
  saveProfileBtn: {
    marginTop: 16,
    backgroundColor: "#60A5FA",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveProfileBtnText: { color: "#041120", fontSize: 15, fontWeight: "800" },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#34D073",
    borderWidth: 2,
    borderColor: "#051122",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: "#F9FBFF", fontSize: 24, fontWeight: "800" },
  email: { color: "#95A7BE", fontSize: 13, marginTop: 4, marginBottom: 12 },
  editButton: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#0D1A2A",
    borderWidth: 1,
    borderColor: "#2B3D55",
  },
  editButtonText: { color: "#D8E7FA", fontSize: 13, fontWeight: "600" },
  sectionWrap: { marginBottom: 16 },
  sectionLabel: {
    color: "#7E90A8",
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "700",
    marginBottom: 10,
  },
  cardBase: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    backgroundColor: "#121F30",
    borderWidth: 1,
    borderColor: "#1E2D41",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  itemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(11,35,64,0.36)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextWrap: { flex: 1 },
  itemTitle: { color: "#F2F8FF", fontSize: 15, fontWeight: "700" },
  itemSubtitle: {
    color: "#D3E2F6",
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
    opacity: 0.9,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(219,235,255,0.18)",
    marginVertical: 4,
  },
  fontSizeTopRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    paddingTop: 6,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  aSmall: { color: "#B9D2EF", fontSize: 12, fontWeight: "700" },
  aLarge: { color: "#DCEBFE", fontSize: 16, fontWeight: "700" },
  slider: { flex: 1, marginHorizontal: 10, height: 30 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  languageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  languageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  languageList: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(225,239,255,0.22)",
    paddingTop: 8,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  languageText: { color: "#DBEAFF", fontSize: 14, fontWeight: "500" },
  languageSelected: { color: "#FFFFFF", fontWeight: "700" },
  radio: {
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#BFD8FB",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: { borderColor: "#63ACFF" },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#63ACFF",
  },
  infoBox: {
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: "#111D2C",
    borderWidth: 1,
    borderColor: "#1F3044",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1C2F46",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoText: { color: "#A9BDD4", fontSize: 12, lineHeight: 17, flex: 1 },
  logoutBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#5A2A37",
    backgroundColor: "#171F2B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },
  logoutText: { color: "#F2A9B8", fontSize: 15, fontWeight: "800" },
  tabBar: {
    height: 68,
    borderTopWidth: 1,
    borderColor: "#162435",
    backgroundColor: "#0A121E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 2,
  },
  bottomTab: { alignItems: "center", gap: 2, minWidth: 58 },
  bottomLabel: { color: "#7D91A8", fontSize: 11, fontWeight: "600" },
  bottomLabelActive: { color: "#4FA2FF" },
  pressed: { opacity: 0.78 },
});
