import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
export default function StudentHomePage() {
  const {
    user
  } = useAuth();
  return <ScrollView contentContainerStyle={{
    padding: 20,
    paddingTop: 56,
    backgroundColor: "#fffbf5",
    minHeight: "100%"
  }}>
      <Text style={{
      color: "#0f766e",
      fontWeight: "900"
    }}>
        ESPACE ÉTUDIANT
      </Text>

      <Text style={{
      marginTop: 8,
      fontSize: 32,
      fontWeight: "900",
      color: "#292524"
    }}>
        Bonjour {user?.firstName || "Étudiant"}
      </Text>

      <Text style={{
      marginTop: 8,
      color: "#6b625b",
      lineHeight: 22
    }}>
        Continue ton apprentissage et découvre de nouvelles formations.
      </Text>

      <View style={{
      marginTop: 22,
      borderRadius: 22,
      padding: 22,
      backgroundColor: "#292524"
    }}>
        <Text style={{
        color: "#6ee7b7",
        fontSize: 32,
        fontWeight: "900",
        lineHeight: 32
      }}>“</Text>
        <Text style={{
        color: "#fff",
        fontSize: 18,
        fontWeight: "900",
        lineHeight: 27
      }}>L’éducation est l’arme la plus puissante que l’on puisse utiliser pour changer le monde.</Text>
        <Text style={{
        marginTop: 13,
        color: "#6ee7b7",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 1.3
      }}>NELSON MANDELA</Text>
      </View>

      <Pressable onPress={() => router.push("/(student)/catalogue")} style={{
      marginTop: 24,
      borderRadius: 22,
      padding: 22,
      backgroundColor: "#0f766e"
    }}>
        <Text style={{
        color: "#fff",
        fontSize: 22,
        fontWeight: "900"
      }}>
          Explorer le catalogue
        </Text>
        <Text style={{
        marginTop: 6,
        color: "#a7f3d0"
      }}>
          Trouve ta prochaine formation.
        </Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(student)/my-courses")} style={{
      marginTop: 16,
      borderRadius: 22,
      padding: 22,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#e7e0d8"
    }}>
        <Text style={{
        color: "#292524",
        fontSize: 22,
        fontWeight: "900"
      }}>
          Mes cours
        </Text>
        <Text style={{
        marginTop: 6,
        color: "#6b625b"
      }}>
          Reprends ta dernière leçon.
        </Text>
      </Pressable>
    </ScrollView>;
}
