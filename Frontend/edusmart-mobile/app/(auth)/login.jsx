import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
export default function LoginPage() {
  const {
    login
  } = useAuth();
  const [email, setEmail] = useState("");
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
        password
      });
      const role = String(user.role || "").toUpperCase();
      router.replace(role === "INSTRUCTOR" ? "/(instructor)/dashboard" : "/(student)/home");
    } catch (error) {
      Alert.alert("Connexion impossible", error.response?.data?.message || error.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fffbf5"
  }}>
      <View style={{
      borderRadius: 28,
      backgroundColor: "#ffffff",
      padding: 24,
      shadowColor: "#000",
      borderWidth: 1,
      borderColor: "#f0e9df",
      shadowOpacity: 0.1,
      shadowRadius: 24,
      shadowOffset: {
        width: 0,
        height: 12
      },
      elevation: 6
    }}>
        <Text style={{
        fontSize: 13,
        fontWeight: "900",
        color: "#0f766e",
        letterSpacing: 2
      }}>
          EDUSMART
        </Text>

        <Text style={{
        marginTop: 10,
        fontSize: 32,
        fontWeight: "900",
        color: "#292524"
      }}>
          Connexion
        </Text>

        <Text style={{
        marginTop: 8,
        color: "#6b625b",
        lineHeight: 22
      }}>
          Accède à ton espace étudiant ou formateur.
        </Text>

        <Text style={{
        marginTop: 24,
        color: "#292524",
        fontWeight: "800"
      }}>
          Adresse courriel
        </Text>

        <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="vous@exemple.com" placeholderTextColor="#9a918a" selectionColor="#0f766e" style={{
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#e7e0d8",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#fffdf9",
        color: "#292524"
      }} />

        <Text style={{
        marginTop: 16,
        color: "#292524",
        fontWeight: "800"
      }}>
          Mot de passe
        </Text>

        <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Votre mot de passe" placeholderTextColor="#9a918a" selectionColor="#0f766e" style={{
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#e7e0d8",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#fffdf9",
        color: "#292524"
      }} />

        <Pressable onPress={handleLogin} disabled={submitting} style={{
        marginTop: 20,
        borderRadius: 16,
        backgroundColor: "#0f766e",
        paddingVertical: 16,
        alignItems: "center",
        opacity: submitting ? 0.65 : 1
      }}>
          {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={{
          color: "#ffffff",
          fontWeight: "900"
        }}>
              Se connecter
            </Text>}
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/register")} style={{
        marginTop: 16,
        alignItems: "center"
      }}>
          <Text style={{
          color: "#0f766e",
          fontWeight: "800"
        }}>
            Créer un compte étudiant
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>;
}
