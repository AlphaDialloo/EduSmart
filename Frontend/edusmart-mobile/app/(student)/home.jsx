import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";

import { useAuth } from "../../src/contexts/AuthContext";

export default function StudentHomePage() {
  const { user } = useAuth();

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingTop: 56,
        backgroundColor: "#f8fafc",
        minHeight: "100%",
      }}
    >
      <Text style={{ color: "#4f46e5", fontWeight: "900" }}>
        ESPACE ÉTUDIANT
      </Text>

      <Text
        style={{
          marginTop: 8,
          fontSize: 32,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Bonjour {user?.firstName || "Étudiant"}
      </Text>

      <Text
        style={{
          marginTop: 8,
          color: "#64748b",
          lineHeight: 22,
        }}
      >
        Continue ton apprentissage et découvre de nouvelles formations.
      </Text>

      <Pressable
        onPress={() => router.push("/(student)/catalogue")}
        style={{
          marginTop: 24,
          borderRadius: 22,
          padding: 22,
          backgroundColor: "#4f46e5",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>
          Explorer le catalogue
        </Text>
        <Text style={{ marginTop: 6, color: "#c7d2fe" }}>
          Trouve ta prochaine formation.
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(student)/my-courses")}
        style={{
          marginTop: 16,
          borderRadius: 22,
          padding: 22,
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 22, fontWeight: "900" }}>
          Mes cours
        </Text>
        <Text style={{ marginTop: 6, color: "#64748b" }}>
          Reprends ta dernière leçon.
        </Text>
      </Pressable>
    </ScrollView>
  );
}
