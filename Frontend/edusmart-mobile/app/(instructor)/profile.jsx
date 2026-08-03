import { Pressable, Text, View } from "react-native";

import { useAuth } from "../../src/contexts/AuthContext";

export default function InstructorProfilePage() {
  const { user, logout } = useAuth();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 56,
        paddingHorizontal: 20,
        backgroundColor: "#f8fafc",
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a" }}>
        Profil formateur
      </Text>

      <View
        style={{
          marginTop: 24,
          borderRadius: 22,
          backgroundColor: "#fff",
          padding: 22,
        }}
      >
        <Text style={{ fontSize: 21, fontWeight: "900", color: "#0f172a" }}>
          {[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
        </Text>

        <Text style={{ marginTop: 7, color: "#64748b" }}>
          {user?.email}
        </Text>
      </View>

      <Pressable
        onPress={logout}
        style={{
          marginTop: 20,
          borderRadius: 16,
          backgroundColor: "#fee2e2",
          paddingVertical: 15,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#b91c1c", fontWeight: "900" }}>
          Déconnexion
        </Text>
      </Pressable>
    </View>
  );
}
