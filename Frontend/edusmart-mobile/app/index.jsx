import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../src/contexts/AuthContext";

export default function IndexPage() {
  const { loading, token, user } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = String(user.role || "").toUpperCase();

  if (role === "INSTRUCTOR") {
    return <Redirect href="/(instructor)/dashboard" />;
  }

  return <Redirect href="/(student)/home" />;
}
