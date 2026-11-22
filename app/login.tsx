import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../contexts/AuthContext";
import { ApiError } from "../lib/api";
import { INK, pastelAt, SOFT_TEXT } from "../lib/pastel";
import type { ParentSchoolOption } from "../lib/types";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

/** Clean minimal login palette (product orange, before any school is known). */
const ORANGE = "#FF7A2F";
const ORANGE_SOFT = "#FFF1E7";
const FIELD = "#F3F3F5";
const OTP_RESEND_COOLDOWN_SEC = 30;

type Step = "phone" | "otp" | "school";

const OtpBoxes = ({
  value,
  onChange
}: {
  value: string;
  onChange: (next: string) => void;
}) => {
  const refs = useRef<Array<{ focus: () => void } | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const focusAt = (index: number): void => {
    refs.current[index]?.focus();
  };

  return (
    <View style={styles.otpRow}>
      {digits.map((digit, index) => (
        <TextInput
          key={`otp-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          style={[styles.otpCell, digit.trim() ? styles.otpCellFilled : null]}
          keyboardType="number-pad"
          maxLength={1}
          value={digit.trim()}
          selectTextOnFocus
          onChangeText={(raw) => {
            const cleaned = raw.replace(/\D/g, "");
            const chars = value.replace(/\D/g, "").split("");
            if (cleaned.length === 0) {
              chars[index] = "";
              onChange(chars.join("").slice(0, 6));
              if (index > 0) {
                focusAt(index - 1);
              }
              return;
            }
            chars[index] = cleaned[cleaned.length - 1] ?? "";
            const next = chars.join("").slice(0, 6);
            onChange(next);
            if (index < 5) {
              focusAt(index + 1);
            }
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && !digit.trim() && index > 0) {
              focusAt(index - 1);
            }
          }}
        />
      ))}
    </View>
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const { user, bootstrapping, requestOtp, verifyOtp, selectSchool } = useAuth();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | undefined>();
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [schools, setSchools] = useState<ParentSchoolOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  const phoneValid = useMemo(() => /^[6-9]\d{9}$/.test(phone), [phone]);
  const otpValid = useMemo(() => /^\d{6}$/.test(otp), [otp]);

  useEffect(() => {
    if (resendIn <= 0) {
      return;
    }
    const id = setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  if (bootstrapping) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const heading =
    step === "school"
      ? "Choose your school"
      : step === "otp"
        ? "Enter the code"
        : "Welcome back";

  const support =
    step === "school"
      ? "This mobile number is linked to more than one school."
      : step === "otp"
        ? `Code sent to +91 ${phone}`
        : "Sign in with the mobile number registered with your school.";

  const onSendOtp = async () => {
    if (!phoneValid) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (step === "otp" && resendIn > 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await requestOtp(phone);
      setDebugOtp(result.debugOtp);
      setOtp("");
      setStep("otp");
      setResendIn(OTP_RESEND_COOLDOWN_SEC);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!otpValid) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await verifyOtp(phone, otp);
      if (result.requiresSchoolSelection && result.selectionToken && result.schools) {
        setSelectionToken(result.selectionToken);
        setSchools(result.schools);
        setStep("school");
        return;
      }
      router.replace("/(app)/(tabs)");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  const onSelectSchool = async (orgCode: string) => {
    if (!selectionToken) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await selectSchool(selectionToken, orgCode);
      router.replace("/(app)/(tabs)");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "School selection failed");
      setStep("phone");
      setSelectionToken(null);
      setSchools([]);
    } finally {
      setBusy(false);
    }
  };

  const order = { phone: 0, otp: 1, school: 2 } as const;
  const currentStep = order[step];

  return (
    <View style={styles.root}>
      {/* single soft accent shape */}
      <View pointerEvents="none" style={styles.blobClip}>
        <View style={styles.blob} />
      </View>

      <SafeAreaView edges={["top", "bottom"]} style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* brand row */}
            <View style={styles.brandRow}>
              <Image
                source={require("../assets/company-logo.png")}
                style={styles.logo}
                contentFit="contain"
                accessibilityLabel="EduNex logo"
              />
              <View>
                <Text style={styles.brandName}>EduNex</Text>
                <Text style={styles.brandTag}>Parent Portal</Text>
              </View>
            </View>

            <View style={styles.body}>
              {/* progress dashes */}
              <View style={styles.progress}>
                {[0, 1, 2].map((index) => (
                  <View
                    key={index}
                    style={[styles.dash, index <= currentStep && styles.dashActive]}
                  />
                ))}
              </View>

              <Text style={styles.title}>{heading}</Text>
              <Text style={styles.subtitle}>{support}</Text>

              {step === "phone" ? (
                <View style={styles.form}>
                  <Text style={styles.label}>Mobile number</Text>
                  <View style={styles.field}>
                    <Text style={styles.prefix}>+91</Text>
                    <View style={styles.fieldDivider} />
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98765 43210"
                      placeholderTextColor="#A1A1AA"
                      autoComplete="tel"
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      (!phoneValid || busy) && styles.buttonDisabled,
                      pressed && styles.buttonPressed
                    ]}
                    disabled={!phoneValid || busy}
                    onPress={() => void onSendOtp()}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Send OTP</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {step === "otp" ? (
                <View style={styles.form}>
                  <Text style={styles.label}>One-time password</Text>
                  <OtpBoxes value={otp} onChange={setOtp} />
                  {debugOtp ? (
                    <View style={styles.debugBox}>
                      <Text style={styles.debugLabel}>Dev OTP</Text>
                      <Text style={styles.debugValue}>{debugOtp}</Text>
                    </View>
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [
                      styles.button,
                      (!otpValid || busy) && styles.buttonDisabled,
                      pressed && styles.buttonPressed
                    ]}
                    disabled={!otpValid || busy}
                    onPress={() => void onVerifyOtp()}
                  >
                    {busy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Verify & continue</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                      </>
                    )}
                  </Pressable>
                  <View style={styles.linkRow}>
                    <Pressable disabled={busy || resendIn > 0} onPress={() => void onSendOtp()}>
                      <Text style={[styles.link, resendIn > 0 && styles.linkDisabled]}>
                        {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
                      </Text>
                    </Pressable>
                    <Text style={styles.linkDot}>·</Text>
                    <Pressable
                      disabled={busy}
                      onPress={() => {
                        setStep("phone");
                        setOtp("");
                        setDebugOtp(undefined);
                        setError(null);
                        setResendIn(0);
                      }}
                    >
                      <Text style={styles.mutedLink}>Change number</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {step === "school" ? (
                <View style={styles.form}>
                  {schools.map((school, index) => (
                    <Pressable
                      key={school.organizationId}
                      style={({ pressed }) => [styles.schoolCard, pressed && styles.schoolCardPressed]}
                      disabled={busy}
                      onPress={() => void onSelectSchool(school.orgCode)}
                    >
                      <View style={[styles.schoolIcon, { backgroundColor: pastelAt(index).bg }]}>
                        <Ionicons name="school-outline" size={22} color={pastelAt(index).accent} />
                      </View>
                      <View style={styles.schoolBody}>
                        <Text style={styles.schoolName}>{school.orgName}</Text>
                        <Text style={styles.schoolChildren}>
                          {school.children.length > 0
                            ? school.children.map((c) => `${c.name} · Gr ${c.grade}`).join("\n")
                            : "No active children listed"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
                    </Pressable>
                  ))}
                  {busy ? <ActivityIndicator color={ORANGE} style={{ marginTop: 8 }} /> : null}
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#E11D48" />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.footer}>
              <View style={styles.footerSecure}>
                <Ionicons name="shield-checkmark-outline" size={15} color={SOFT_TEXT} />
                <Text style={styles.footerText}>Secure sign-in with OTP</Text>
              </View>
              <Text style={styles.footerVersion}>Version {APP_VERSION}</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFFFF", overflow: "hidden" },
  flex: { flex: 1 },
  // Clipped corner box: keeps the circle from widening the page (web scrolls
  // overflow-hidden containers sideways when an input is focused).
  blobClip: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 170,
    height: 160,
    overflow: "hidden"
  },
  blob: {
    position: "absolute",
    top: -120,
    left: 0,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: ORANGE_SOFT
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 52, height: 52 },
  brandName: { fontSize: 18, fontWeight: "800", color: INK, letterSpacing: -0.3 },
  brandTag: { fontSize: 12, color: SOFT_TEXT, marginTop: 1 },
  body: { flex: 1, justifyContent: "center", paddingVertical: 32 },
  progress: { flexDirection: "row", gap: 6, marginBottom: 22 },
  dash: { width: 22, height: 4, borderRadius: 2, backgroundColor: "#E7E7EA" },
  dashActive: { width: 34, backgroundColor: ORANGE },
  title: { fontSize: 36, lineHeight: 42, fontWeight: "800", color: INK, letterSpacing: -1 },
  subtitle: { marginTop: 10, fontSize: 15, lineHeight: 22, color: "#71717A" },
  form: { marginTop: 32, gap: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#52525B" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: FIELD,
    borderRadius: 16,
    height: 58,
    paddingHorizontal: 18
  },
  prefix: { fontSize: 17, fontWeight: "700", color: INK },
  fieldDivider: { width: 1, height: 24, backgroundColor: "#DADADF", marginHorizontal: 14 },
  input: { flex: 1, minWidth: 0, height: "100%", fontSize: 18, color: INK, letterSpacing: 0.5 },
  otpRow: { flexDirection: "row", gap: 8 },
  otpCell: {
    flex: 1,
    minWidth: 0,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: FIELD,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: INK
  },
  otpCellFilled: { borderColor: ORANGE, backgroundColor: "#FFFFFF" },
  button: {
    height: 58,
    borderRadius: 16,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 6
  },
  buttonDisabled: { opacity: 0.4 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  debugBox: {
    borderRadius: 14,
    backgroundColor: ORANGE_SOFT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  debugLabel: { color: "#B4531B", fontSize: 12, fontWeight: "600" },
  debugValue: { color: "#B4531B", fontSize: 16, fontWeight: "800", letterSpacing: 2 },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 4
  },
  link: { color: ORANGE, fontWeight: "700", fontSize: 14 },
  linkDisabled: { color: SOFT_TEXT },
  mutedLink: { color: "#71717A", fontWeight: "600", fontSize: 14 },
  linkDot: { color: SOFT_TEXT },
  schoolCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    backgroundColor: FIELD,
    padding: 16
  },
  schoolCardPressed: { opacity: 0.85 },
  schoolIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  schoolBody: { flex: 1 },
  schoolName: { fontSize: 16, fontWeight: "700", color: INK },
  schoolChildren: { marginTop: 4, fontSize: 13, lineHeight: 18, color: SOFT_TEXT },
  errorBox: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF1F2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  error: { flex: 1, color: "#E11D48", fontSize: 13, fontWeight: "600" },
  footer: { alignItems: "center", gap: 6, paddingTop: 8 },
  footerSecure: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerText: { fontSize: 13, color: SOFT_TEXT },
  footerVersion: { fontSize: 12, color: "#A1A1AA", fontWeight: "500" }
});
