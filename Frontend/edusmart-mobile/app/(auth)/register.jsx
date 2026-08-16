import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
export default function RegisterPage() {
  const {
    register
  } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [submitting, setSubmitting] = useState(false);
  function change(name, value) {
    setForm(current => ({
      ...current,
      [name]: value
    }));
  }
  async function handleRegister() {
    try {
      setSubmitting(true);
      await register({
        ...form,
        email: form.email.trim().toLowerCase(),
        role: "STUDENT"
      });
      router.replace("/(student)/home");
    } catch (error) {
      Alert.alert("Inscription impossible", error.response?.data?.message || error.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{
    flex: 1,
    backgroundColor: "#fffbf5"
  }}>
      <ScrollView contentContainerStyle={{
      flexGrow: 1,
      justifyContent: "center",
      padding: 24
    }}>
        <View style={{
        borderRadius: 28,
        backgroundColor: "#fff",
        padding: 24
      }}>
          <Text style={{
          fontSize: 30,
          fontWeight: "900",
          color: "#292524"
        }}>
            Créer un compte
          </Text>

          {[["firstName", "Prénom"], ["lastName", "Nom"], ["email", "Courriel"], ["password", "Mot de passe"]].map(([name, placeholder]) => <TextInput key={name} value={form[name]} onChangeText={value => change(name, value)} placeholder={placeholder} secureTextEntry={name === "password"} keyboardType={name === "email" ? "email-address" : "default"} autoCapitalize={name === "email" ? "none" : "sentences"} style={{
          marginTop: 14,
          borderWidth: 1,
          borderColor: "#e7e0d8",
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 14
        }} />)}

          <Pressable onPress={handleRegister} disabled={submitting} style={{
          marginTop: 20,
          borderRadius: 16,
          backgroundColor: "#0f766e",
          paddingVertical: 16,
          alignItems: "center"
        }}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{
            color: "#fff",
            fontWeight: "900"
          }}>
                S’inscrire
              </Text>}
          </Pressable>

          <Pressable onPress={() => router.back()} style={{
          marginTop: 16,
          alignItems: "center"
        }}>
            <Text style={{
            color: "#0f766e",
            fontWeight: "800"
          }}>
              Retour à la connexion
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>;
}
