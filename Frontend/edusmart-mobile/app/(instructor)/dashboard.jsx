import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../../src/contexts/AuthContext";
import { getInstructorDashboard } from "../../src/services/instructor.service";

function StatCard({ value, label }) {
  return (
    <View
      style={{
        width: "48%",
        minHeight: 112,
        borderRadius: 20,
        backgroundColor: "#fff",
        padding: 17,
        borderWidth: 1,
        borderColor: "#e2e8f0",
      }}
    >
      <Text
        style={{
          fontSize: 27,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          marginTop: 8,
          color: "#64748b",
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function InstructorDashboardPage() {
  const { token, user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    async ({ refresh = false } = {}) => {
      if (!token) {
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        setError("");

        const data = await getInstructorDashboard(token);
        setDashboard(data);
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Impossible de charger le dashboard.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    load();
  }, [load]);

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
        <ActivityIndicator
          size="large"
          color="#4f46e5"
        />
      </View>
    );
  }

  const stats = dashboard?.stats || dashboard?.summary || {};
  const recentCourses =
    dashboard?.recentCourses ||
    dashboard?.courses ||
    [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load({ refresh: true })}
        />
      }
      contentContainerStyle={{
        padding: 19,
        paddingTop: 54,
        paddingBottom: 95,
        backgroundColor: "#f8fafc",
      }}
    >
      <Text
        style={{
          color: "#4f46e5",
          fontWeight: "900",
          letterSpacing: 1.5,
        }}
      >
        ESPACE FORMATEUR
      </Text>

      <Text
        style={{
          marginTop: 8,
          fontSize: 31,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Bonjour {user?.firstName || "Formateur"}
      </Text>

      <Text
        style={{
          marginTop: 7,
          color: "#64748b",
          lineHeight: 21,
        }}
      >
        Suivez vos cours, vos étudiants et vos revenus.
      </Text>

      {error ? (
        <View
          style={{
            marginTop: 16,
            borderRadius: 14,
            backgroundColor: "#fee2e2",
            padding: 13,
          }}
        >
          <Text
            style={{
              color: "#b91c1c",
              fontWeight: "800",
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          marginTop: 22,
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <StatCard
          value={stats.totalCourses || 0}
          label="Cours"
        />

        <StatCard
          value={stats.publishedCourses || 0}
          label="Publiés"
        />

        <StatCard
          value={stats.totalStudents || 0}
          label="Étudiants"
        />

        <StatCard
          value={stats.totalResources || 0}
          label="Ressources"
        />
      </View>

      <View
        style={{
          marginTop: 20,
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Pressable
          onPress={() =>
            router.push("/(instructor)/courses/create")
          }
          style={{
            flex: 1,
            minHeight: 53,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            backgroundColor: "#4f46e5",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "900",
            }}
          >
            Créer un cours
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push("/(instructor)/sales")
          }
          style={{
            flex: 1,
            minHeight: 53,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            backgroundColor: "#e0e7ff",
          }}
        >
          <Text
            style={{
              color: "#4338ca",
              fontWeight: "900",
            }}
          >
            Voir les ventes
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          marginTop: 27,
          fontSize: 22,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Cours récents
      </Text>

      {recentCourses.length === 0 ? (
        <View
          style={{
            marginTop: 14,
            borderRadius: 20,
            backgroundColor: "#fff",
            padding: 24,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontWeight: "900",
              color: "#0f172a",
            }}
          >
            Aucun cours
          </Text>
        </View>
      ) : (
        recentCourses.slice(0, 4).map((course) => {
          const courseId = course._id || course.id;

          return (
            <Pressable
              key={courseId}
              onPress={() =>
                router.push(
                  `/courses/manage/${courseId}`,
                )
              }
              style={{
                marginTop: 12,
                borderRadius: 19,
                backgroundColor: "#fff",
                padding: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "900",
                  color: "#0f172a",
                }}
              >
                {course.title}
              </Text>

              <Text
                style={{
                  marginTop: 6,
                  color: "#64748b",
                }}
              >
                {course.status} ·{" "}
                {course.modulesCount ??
                  course.modules?.length ??
                  0}{" "}
                module(s)
              </Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}
