import { Pressable, Text, View } from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
export default function StudentProfilePage() {
  const {
    user,
    logout
  } = useAuth();
  return <View style={{
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
    backgroundColor: "#fffbf5"
  }}>
      <Text style={{
      fontSize: 30,
      fontWeight: "900",
      color: "#292524"
    }}>
        Profil
      </Text>

      <View style={{
      marginTop: 24,
      borderRadius: 22,
      backgroundColor: "#fff",
      padding: 22
    }}>
        <Text style={{
        fontSize: 21,
        fontWeight: "900",
        color: "#292524"
      }}>
          {[user?.firstName, user?.lastName].filter(Boolean).join(" ")}
        </Text>

        <Text style={{
        marginTop: 7,
        color: "#6b625b"
      }}>
          {user?.email}
        </Text>

        <Text style={{
        marginTop: 7,
        color: "#0f766e",
        fontWeight: "900"
      }}>
          {user?.role}
        </Text>
      </View>

      <Pressable onPress={logout} style={{
      marginTop: 20,
      borderRadius: 16,
      backgroundColor: "#fee2e2",
      paddingVertical: 15,
      alignItems: "center"
    }}>
        <Text style={{
        color: "#b91c1c",
        fontWeight: "900"
      }}>
          Déconnexion
        </Text>
      </Pressable>
    </View>;
}
