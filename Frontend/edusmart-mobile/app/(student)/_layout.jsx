import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
export default function StudentLayout() {
  const {
    loading,
    token,
    user
  } = useAuth();
  if (!loading && (!token || !user)) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!loading && String(user?.role || "").toUpperCase() === "INSTRUCTOR") {
    return <Redirect href="/(instructor)/dashboard" />;
  }
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: "#0f766e",
    tabBarInactiveTintColor: "#9a918a",
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "700"
    },
    tabBarStyle: {
      height: 72,
      paddingTop: 8,
      paddingBottom: 10,
      borderTopWidth: 0,
      backgroundColor: "#fffdf9",
      shadowColor: "#292524",
      shadowOpacity: 0.08,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: -6
      },
      elevation: 12
    }
  }}>
      <Tabs.Screen name="home" options={{
      title: "Accueil",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="home-outline" color={color} size={size} />
    }} />

      <Tabs.Screen name="catalogue" options={{
      title: "Catalogue",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="search-outline" color={color} size={size} />
    }} />

      <Tabs.Screen name="my-courses" options={{
      title: "Mes cours",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="book-outline" color={color} size={size} />
    }} />

      <Tabs.Screen name="recommendations" options={{
      title: "Pour vous",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="sparkles-outline" color={color} size={size} />
    }} />

      <Tabs.Screen name="profile" options={{
      title: "Profil",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="person-outline" color={color} size={size} />
    }} />
    </Tabs>;
}
