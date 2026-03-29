import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { updateProfile } from "firebase/auth";
import { getAuthProfile, updateAuthProfile } from "../../services/api/auth";
import { ApiError } from "../../services/api/client";
import { getSession, setSession, type AppUser } from "../../services/api/session";
import { auth } from "../../services/firebase/client";
import { deleteProfileAvatar, uploadProfileAvatar } from "../../services/firebase/profilePhoto";

type DriverSettingsScreenProps = {
  onLogout?: () => void;
};

function formatMemberSince(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-LK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function roleLabel(role: string) {
  const r = role.toUpperCase();
  if (r === "DRIVER") return "Driver";
  if (r === "ADMIN") return "Admin";
  return "Passenger";
}

export default function DriverSettingsScreen({ onLogout }: DriverSettingsScreenProps) {
  const [pushAlerts, setPushAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoCheckIn, setAutoCheckIn] = useState(false);
  const [nightMode, setNightMode] = useState(true);

  const [profile, setProfile] = useState<AppUser | null>(() => getSession().user);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

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
    setSaving(true);
    try {
      const next = await updateAuthProfile({
        fullName,
        phone: editPhone.trim() === "" ? null : editPhone.trim(),
      });
      applyProfile(next);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName });
      }
      Alert.alert("Saved", "Your changes were saved.");
    } catch (e) {
      Alert.alert(
        "Could not save",
        e instanceof ApiError ? e.message : "Something went wrong. Try again."
      );
    } finally {
      setSaving(false);
    }
  }, [applyProfile, editFullName, editPhone]);

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

  const displayName =
    profile?.fullName?.trim() ||
    auth.currentUser?.displayName?.trim() ||
    editFullName.trim() ||
    "Driver";
  const displayEmail =
    profile?.email?.trim() || auth.currentUser?.email?.trim() || "—";
  const emailVerified = auth.currentUser?.emailVerified ?? false;
  const memberSince = formatMemberSince(profile?.createdAt);

  const driverStatusLine = (() => {
    if (!auth.currentUser) return "Not signed in";
    const isDriver = (profile?.role ?? "DRIVER").toUpperCase() === "DRIVER";
    if (!isDriver) return emailVerified ? "Verified account" : "Not verified";
    return emailVerified ? "Verified driver" : "Not verified · confirm your email";
  })();

  const dirty =
    profile != null &&
    (editFullName.trim() !== (profile.fullName ?? "").trim() ||
      editPhone.trim() !== (typeof profile.phone === "string" ? profile.phone : "").trim());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.profileCard}>
        <Pressable
          style={styles.avatarPress}
          onPress={openPhotoOptions}
          disabled={profileLoading || photoUploading}
          hitSlop={6}
        >
          <View style={styles.avatar}>
            {profile?.photoUrl?.trim() ? (
              <Image
                source={{ uri: profile.photoUrl.trim() }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <Ionicons name="person" size={26} color="#E9F2FC" />
            )}
            {photoUploading ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : null}
          </View>
          <View style={styles.avatarBadge} pointerEvents="none">
            <Ionicons name="camera" size={13} color="#0D2135" />
          </View>
        </Pressable>
        <View style={styles.profileText}>
          {profileLoading ? (
            <View style={styles.profileLoadingRow}>
              <ActivityIndicator size="small" color="#67A9EA" />
              <Text style={styles.loadingInline}>Loading profile…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.role} numberOfLines={1}>
                {roleLabel(profile?.role ?? "DRIVER")}
              </Text>
              <Text style={styles.emailLine} numberOfLines={2}>
                {displayEmail}
              </Text>
              <Text style={styles.shift}>
                {emailVerified ? "Email verified" : "Email not verified"}
                {memberSince ? ` · Since ${memberSince}` : ""}
              </Text>
            </>
          )}
        </View>
      </View>

      {profileError ? (
        <Pressable style={styles.profileErrorBanner} onPress={() => void loadProfile()}>
          <Ionicons name="alert-circle-outline" size={16} color="#F0A8B8" />
          <Text style={styles.profileErrorText}>{profileError} · Tap to retry</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Full name</Text>
        <TextInput
          value={editFullName}
          onChangeText={setEditFullName}
          placeholder="Your full name"
          placeholderTextColor="#5C6B7A"
          style={styles.input}
          editable={!profileLoading && !saving}
          autoCapitalize="words"
        />

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Phone</Text>
        <TextInput
          value={editPhone}
          onChangeText={setEditPhone}
          placeholder="e.g. +94 77 123 4567"
          placeholderTextColor="#5C6B7A"
          style={styles.input}
          editable={!profileLoading && !saving}
          keyboardType="phone-pad"
        />

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Email</Text>
        <Text style={styles.readOnlyValue}>{displayEmail}</Text>

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Status</Text>
        <Text
          style={[
            styles.readOnlyValue,
            driverStatusLine.startsWith("Verified") ? styles.statusVerified : styles.statusPlain,
          ]}
        >
          {driverStatusLine}
        </Text>

        <Pressable
          style={[styles.saveBtn, (!dirty || saving || profileLoading) && styles.saveBtnDisabled]}
          onPress={() => void saveAccount()}
          disabled={!dirty || saving || profileLoading}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#0D2135" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.sectionCard}>
        <SwitchRow label="Push notifications" value={pushAlerts} onPress={() => setPushAlerts((p) => !p)} />
        <SwitchRow label="Sound alerts for incidents" value={soundAlerts} onPress={() => setSoundAlerts((p) => !p)} />
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.sectionCard}>
        <SwitchRow label="Auto check-in at first stop" value={autoCheckIn} onPress={() => setAutoCheckIn((p) => !p)} />
        <SwitchRow label="Night mode surfaces" value={nightMode} onPress={() => setNightMode((p) => !p)} />
      </View>

      <Text style={styles.sectionTitle}>Emergency</Text>
      <View style={styles.sectionCard}>
        <ActionRow icon="call-outline" title="Emergency Contact" subtitle="Transit Control +94 11 234 5678" />
        <ActionRow icon="shield-checkmark-outline" title="Safety Checklist" subtitle="Review before each shift" />
      </View>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#F2A9B8" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function SwitchRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.switchRow} onPress={onPress}>
      <Text style={styles.switchLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.knob, value && styles.knobActive]} />
      </View>
    </Pressable>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.actionRow}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={16} color="#8BB8E4" />
      </View>
      <View style={styles.actionText}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#071523" },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28 },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243446",
    backgroundColor: "#1A232F",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarPress: {
    position: "relative",
    marginRight: 2,
    opacity: 1,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2E4054",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#67A9EA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1A232F",
  },
  profileText: { marginLeft: 10, flex: 1 },
  profileLoadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingInline: { color: "#9EB3C8", fontSize: 14, fontWeight: "600" },
  name: { color: "#EDF5FC", fontSize: 17, fontWeight: "800" },
  role: { color: "#9EB3C8", fontSize: 12, marginTop: 4, fontWeight: "700" },
  emailLine: { color: "#B8C9DA", fontSize: 13, marginTop: 4, fontWeight: "600" },
  shift: { color: "#7FC6A0", fontSize: 12, marginTop: 4, fontWeight: "700" },
  profileErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#2A1F24",
    borderWidth: 1,
    borderColor: "#5A3540",
    marginBottom: 12,
  },
  profileErrorText: { color: "#F0C4CB", fontSize: 12, fontWeight: "600", flex: 1 },
  sectionTitle: { color: "#D7E2ED", fontSize: 15, fontWeight: "800", marginBottom: 8, marginTop: 4 },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#243446",
    backgroundColor: "#171F2B",
    padding: 12,
    marginBottom: 14,
  },
  fieldLabel: { color: "#8FA4B8", fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  fieldLabelSpaced: { marginTop: 14 },
  input: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2D3D52",
    backgroundColor: "#0F141C",
    color: "#E6EFF9",
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  readOnlyValue: {
    marginTop: 6,
    color: "#C7D6E5",
    fontSize: 14,
    fontWeight: "600",
  },
  statusVerified: { color: "#7FC6A0" },
  statusPlain: { color: "#D0D8E2" },
  saveBtn: {
    marginTop: 18,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#67A9EA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: "#0D2135", fontSize: 16, fontWeight: "800" },
  switchRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  switchLabel: { color: "#C7D6E5", fontSize: 13, fontWeight: "600", flex: 1, paddingRight: 10 },
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#445468",
    padding: 2,
  },
  toggleActive: { backgroundColor: "#4EAF80" },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#F0F6FF" },
  knobActive: { marginLeft: 18 },
  actionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1E2C3D",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { marginLeft: 9, flex: 1 },
  actionTitle: { color: "#E6EFF9", fontSize: 13, fontWeight: "700" },
  actionSubtitle: { color: "#93A8BD", fontSize: 11, marginTop: 2, fontWeight: "600" },
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
});
