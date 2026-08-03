import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../../src/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("marvel@test.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Champs manquants", "Saisis ton courriel et ton mot de passe.");
      return;
    }

    try {
      setSubmitting(true);

      const user = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const role = String(user.role || "").toUpperCase();

      router.replace(
        role === "INSTRUCTOR"
          ? "/(instructor)/dashboard"
          : "/(student)/home",
      );
    } catch (error) {
      Alert.alert(
        "Connexion impossible",
        error.response?.data?.message ||
          error.message ||
          "Une erreur est survenue.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f8fafc",
      }}
    >
      <View
        style={{
          borderRadius: 28,
          backgroundColor: "#ffffff",
          padding: 24,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "900",
            color: "#4f46e5",
            letterSpacing: 2,
          }}
        >
          EDUSMART
        </Text>

        <Text
          style={{
            marginTop: 10,
            fontSize: 32,
            fontWeight: "900",
            color: "#0f172a",
          }}
        >
          Connexion
        </Text>

        <Text
          style={{
            marginTop: 8,
            color: "#64748b",
            lineHeight: 22,
          }}
        >
          Accède à ton espace étudiant ou formateur.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Courriel"
          style={{
            marginTop: 24,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "#fff",
          }}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mot de passe"
          style={{
            marginTop: 14,
            borderWidth: 1,
            borderColor: "#e2e8f0",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: "#fff",
          }}
        />

        <Pressable
          onPress={handleLogin}
          disabled={submitting}
          style={{
            marginTop: 20,
            borderRadius: 16,
            backgroundColor: "#4f46e5",
            paddingVertical: 16,
            alignItems: "center",
            opacity: submitting ? 0.65 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontWeight: "900" }}>
              Se connecter
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          style={{
            marginTop: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#4f46e5", fontWeight: "800" }}>
            Créer un compte étudiant
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
