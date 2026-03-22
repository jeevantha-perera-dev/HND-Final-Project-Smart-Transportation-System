import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { UserRole } from "./LoginScreen";

type RegisterScreenProps = {
  onBack?: () => void;
  onSignIn?: () => void;
  onCreateAccount?: (role: UserRole) => void;
};

export default function RegisterScreen({
  onBack,
  onSignIn,
  onCreateAccount,
}: RegisterScreenProps) {
  const [role, setRole] = useState<UserRole>("passenger");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Ionicons name="chevron-back" size={22} color="#E4EEF9" />
            </Pressable>
            <Text style={styles.headerTitle}>Create Account</Text>
          </View>
          <View style={styles.separator} />

          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="bus-outline" size={32} color="#0A1727" />
            </View>
            <Text style={styles.title}>Join the Flow</Text>
            <Text style={styles.subtitle}>The smartest way to navigate your city</Text>
          </View>

          <Field
            label="Full Name"
            icon="person-outline"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your name"
          />
          <Field
            label="Email Address"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="example@mail.com"
            keyboardType="email-address"
          />
          <Field
            label="Phone Number"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#7F97AF" />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 8 characters"
              placeholderTextColor="#7E95AC"
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#7F97AF"
              />
            </Pressable>
          </View>

          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleRow}>
            <RoleCard
              icon="bus-outline"
              title="Passenger"
              subtitle="Book seats & track buses"
              active={role === "passenger"}
              onPress={() => setRole("passenger")}
            />
            <RoleCard
              icon="radio-button-on-outline"
              title="Driver"
              subtitle="Manage routes & fleet"
              active={role === "driver"}
              onPress={() => setRole("driver")}
            />
          </View>

          <Pressable style={styles.termsRow} onPress={() => setAgreed((prev) => !prev)}>
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed ? <Ionicons name="checkmark" size={12} color="#0C2D4A" /> : null}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.link}>Terms of Service</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.createBtn, !agreed && styles.createBtnDisabled]}
            disabled={!agreed}
            onPress={() => onCreateAccount?.(role)}
          >
            <Text style={styles.createText}>Create Account</Text>
            <Ionicons name="arrow-forward-outline" size={18} color="#123457" />
          </Pressable>

          <View style={styles.signInRow}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <Pressable onPress={onSignIn}>
              <Text style={styles.signInLink}>Sign In</Text>
            </Pressable>
          </View>

          <View style={styles.securityCard}>
            <View style={styles.securityIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#CFDAE6" />
            </View>
            <View style={styles.securityTextWrap}>
              <Text style={styles.securityTitle}>Secure Registration</Text>
              <Text style={styles.securityBody}>
                Your data is encrypted with bank-level security protocols.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type FieldProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
};

function Field({
  label,
  icon,
  value,
  placeholder,
  onChangeText,
  keyboardType = "default",
}: FieldProps) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color="#7F97AF" />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#7E95AC"
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </>
  );
}

type RoleCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  active?: boolean;
  onPress: () => void;
};

function RoleCard({ icon, title, subtitle, active, onPress }: RoleCardProps) {
  return (
    <Pressable style={[styles.roleCard, active && styles.roleCardActive]} onPress={onPress}>
      <View style={[styles.roleIconWrap, active && styles.roleIconWrapActive]}>
        <Ionicons name={icon} size={18} color={active ? "#071A2F" : "#D8E3EF"} />
      </View>
      <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{title}</Text>
      <Text style={styles.roleSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#09111B" },
  flex: { flex: 1 },
  content: { paddingBottom: 24 },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#F1F7FE", fontSize: 28, fontWeight: "800" },
  separator: { height: 1, backgroundColor: "#1D2A3A", marginBottom: 14 },
  logoWrap: { alignItems: "center", marginBottom: 16 },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#F8FCFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { color: "#F2F8FF", fontSize: 42, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { color: "#A5B5C7", fontSize: 14, marginTop: 2, fontWeight: "600" },
  label: {
    color: "#DFE8F1",
    fontSize: 13,
    fontWeight: "700",
    marginHorizontal: 14,
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrap: {
    height: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#223549",
    backgroundColor: "#111C29",
    marginHorizontal: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  input: { flex: 1, marginLeft: 8, color: "#EAF3FD", fontSize: 15, fontWeight: "600" },
  roleRow: { flexDirection: "row", gap: 10, marginHorizontal: 14, marginTop: 2, marginBottom: 8 },
  roleCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263748",
    backgroundColor: "#151F2B",
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 96,
  },
  roleCardActive: {
    borderColor: "#4DA2EF",
    backgroundColor: "#103A66",
  },
  roleIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2A3A4B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  roleIconWrapActive: { backgroundColor: "#5AA9F3" },
  roleTitle: { color: "#EAF4FF", fontSize: 15, fontWeight: "800" },
  roleTitleActive: { color: "#DFF0FF" },
  roleSubtitle: { color: "#AFC1D4", fontSize: 11, fontWeight: "600", marginTop: 2, textAlign: "center" },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#33526E",
    backgroundColor: "#132131",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    borderColor: "#67A9EA",
    backgroundColor: "#67A9EA",
  },
  termsText: { flex: 1, color: "#C5D3E2", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  link: { color: "#65AEEF", fontWeight: "700" },
  createBtn: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#66AEEF",
    marginHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  createBtnDisabled: { opacity: 0.55 },
  createText: { color: "#17385A", fontSize: 17, fontWeight: "800" },
  signInRow: {
    marginTop: 14,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: { color: "#C1D2E2", fontSize: 14, fontWeight: "600" },
  signInLink: { color: "#66AEEF", fontSize: 14, fontWeight: "800" },
  securityCard: {
    marginHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#23374C",
    backgroundColor: "#151F2A",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  securityIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1F2B3A",
    alignItems: "center",
    justifyContent: "center",
  },
  securityTextWrap: { flex: 1 },
  securityTitle: { color: "#F0F7FF", fontSize: 16, fontWeight: "800", marginBottom: 2 },
  securityBody: { color: "#B2C3D5", fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
