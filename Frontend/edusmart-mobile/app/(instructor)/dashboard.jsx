import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../src/contexts/AuthContext";
import { getInstructorDashboard } from "../../src/services/instructor.service";

export default function InstructorDashboardPage() {
  const { token, user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getInstructorDashboard(token);

        if (active) {
          setDashboard(data);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [token]);

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

  const stats = dashboard?.stats || {};

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
        ESPACE FORMATEUR
      </Text>

      <Text
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Bonjour {user?.firstName || "Formateur"}
      </Text>

      <View
        style={{
          marginTop: 24,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {[
          ["Cours", stats.totalCourses || 0],
          ["Publiés", stats.publishedCourses || 0],
          ["Étudiants", stats.totalStudents || 0],
          ["Inscriptions", stats.totalEnrollments || 0],
        ].map(([label, value]) => (
          <View
            key={label}
            style={{
              width: "47%",
              borderRadius: 20,
              backgroundColor: "#fff",
              padding: 18,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontSize: 26, fontWeight: "900", color: "#0f172a" }}>
              {value}
            </Text>
            <Text style={{ marginTop: 6, color: "#64748b", fontWeight: "700" }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
