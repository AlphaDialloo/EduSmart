import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
export default function InstructorLayout() {
  const {
    loading,
    token,
    user
  } = useAuth();
  if (!loading && (!token || !user)) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!loading && String(user?.role || "").toUpperCase() !== "INSTRUCTOR") {
    return <Redirect href="/(student)/home" />;
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
      <Tabs.Screen name="dashboard" options={{
      title: "Dashboard",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="grid-outline" color={color} size={size} />
    }} />

      <Tabs.Screen name="courses" options={{
      title: "Cours",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="book-outline" color={color} size={size} />
    }} />

      <Tabs.Screen name="courses/create" options={{
      href: null
    }} />

      <Tabs.Screen name="sales" options={{
      title: "Ventes",
      tabBarIcon: ({
        color,
        size
      }) => <Ionicons name="stats-chart-outline" color={color} size={size} />
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
