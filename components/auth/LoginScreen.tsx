import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type UserRole = "passenger" | "driver";

type LoginScreenProps = {
  onLogin?: (payload: { role: UserRole; email: string; password: string }) => Promise<void> | void;
  onRegister?: () => void;
  onForgotPassword?: () => void;
};

export default function LoginScreen({
  onLogin,
  onRegister,
  onForgotPassword,
}: LoginScreenProps) {
  const [role, setRole] = useState<UserRole>("passenger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    try {
      setSubmitting(true);
      await onLogin?.({ role, email: email.trim().toLowerCase(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardSafeArea}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to track your bus or manage routes
          </Text>

          <View style={styles.roleSwitch}>
            <Pressable
              style={[styles.roleButton, role === "passenger" && styles.roleActive]}
              onPress={() => setRole("passenger")}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={role === "passenger" ? "#FFFFFF" : "#8FA4B9"}
              />
              <Text
                style={[
                  styles.roleText,
                  role === "passenger" ? styles.roleTextActive : styles.roleTextInactive,
                ]}
              >
                Passenger
              </Text>
            </Pressable>

            <Pressable
              style={[styles.roleButton, role === "driver" && styles.roleActive]}
              onPress={() => setRole("driver")}
            >
              <Ionicons
                name="bus-outline"
                size={16}
                color={role === "driver" ? "#FFFFFF" : "#8FA4B9"}
              />
              <Text
                style={[
                  styles.roleText,
                  role === "driver" ? styles.roleTextActive : styles.roleTextInactive,
                ]}
              >
                Driver
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#7D93A8" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@example.com"
              placeholderTextColor="#7D93A8"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#7D93A8" />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
              placeholderTextColor="#7D93A8"
              style={styles.input}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#7D93A8"
              />
            </Pressable>
          </View>

          <Pressable style={styles.inlineLinkWrap} onPress={onForgotPassword}>
            <Text style={styles.inlineLink}>Forgot Password?</Text>
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.loginButton} onPress={handleLogin} disabled={submitting}>
            <Text style={styles.loginText}>{submitting ? "Logging in..." : "Log in"}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Pressable onPress={onRegister}>
              <Text style={styles.footerLink}>Register</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#041323",
  },
  keyboardSafeArea: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#071A2D",
    borderWidth: 1,
    borderColor: "#102A44",
    paddingHorizontal: 20,
    paddingVertical: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    color: "#F4F7FB",
    fontSize: 44,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 12,
    color: "#A1B2C2",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  roleSwitch: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#1E3550",
    padding: 4,
    flexDirection: "row",
    marginBottom: 26,
  },
  roleButton: {
    flex: 1,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  roleActive: {
    backgroundColor: "#081D31",
  },
  roleText: {
    fontSize: 24,
    fontWeight: "600",
  },
  roleTextActive: {
    color: "#FFFFFF",
  },
  roleTextInactive: {
    color: "#8FA4B9",
  },
  label: {
    color: "#CFD9E3",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2B4964",
    backgroundColor: "#13283D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: "#EAF1F8",
    fontSize: 16,
  },
  inlineLinkWrap: {
    alignSelf: "flex-end",
    marginBottom: 28,
  },
  inlineLink: {
    color: "#1EA2FF",
    fontSize: 15,
    fontWeight: "600",
  },
  loginButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#67A9EA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    shadowColor: "#67A9EA",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  loginText: {
    color: "#F8FCFF",
    fontSize: 20,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#8EA1B4",
    fontSize: 15,
  },
  footerLink: {
    color: "#1EA2FF",
    fontSize: 15,
    fontWeight: "700",
  },
  errorText: {
    color: "#FF8E8E",
    marginBottom: 12,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
});
