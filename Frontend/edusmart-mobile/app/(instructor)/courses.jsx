import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../../src/contexts/AuthContext";
import { getInstructorCourses } from "../../src/services/instructor.service";

function getStatusLabel(status) {
  const labels = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    ARCHIVED: "Archivé",
  };

  return labels[status] || status || "Inconnu";
}

function getStatusStyle(status) {
  if (status === "PUBLISHED") {
    return { backgroundColor: "#dcfce7", color: "#15803d" };
  }

  if (status === "DRAFT") {
    return { backgroundColor: "#fef3c7", color: "#b45309" };
  }

  return { backgroundColor: "#e2e8f0", color: "#475569" };
}

export default function InstructorCoursesPage() {
  const { token, logout } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCourses = useCallback(
    async ({ refresh = false } = {}) => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        refresh ? setRefreshing(true) : setLoading(true);
        setError("");

        const data = await getInstructorCourses(token);

        const items = Array.isArray(data?.courses)
          ? data.courses
          : Array.isArray(data?.items)
            ? data.items
            : [];

        setCourses(items);
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          setError("Votre session a expiré. Veuillez vous reconnecter.");
          setTimeout(() => logout(), 700);
          return;
        }

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Impossible de charger les cours.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, logout],
  );

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 52,
        paddingHorizontal: 18,
        backgroundColor: "#f8fafc",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a" }}>
            Mes cours
          </Text>

          <Text style={{ marginTop: 5, color: "#64748b" }}>
            Gérez vos formations.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/(instructor)/courses/create")}
          style={({ pressed }) => ({
            borderRadius: 16,
            backgroundColor: pressed ? "#4338ca" : "#4f46e5",
            paddingHorizontal: 16,
            paddingVertical: 12,
          })}
        >
          <Text style={{ color: "#ffffff", fontWeight: "900" }}>
            Ajouter
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View
          style={{
            marginTop: 16,
            borderRadius: 16,
            backgroundColor: "#fee2e2",
            padding: 14,
          }}
        >
          <Text style={{ color: "#b91c1c", fontWeight: "800" }}>
            {error}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ marginTop: 12, color: "#64748b", fontWeight: "700" }}>
            Chargement des cours...
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item, index) =>
            String(item?._id || item?.id || index)
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCourses({ refresh: true })}
              tintColor="#4f46e5"
            />
          }
          contentContainerStyle={{
            paddingVertical: 18,
            paddingBottom: 100,
            flexGrow: courses.length === 0 ? 1 : 0,
          }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 80,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#0f172a" }}>
                Aucun cours
              </Text>

              <Text
                style={{
                  marginTop: 8,
                  textAlign: "center",
                  color: "#64748b",
                }}
              >
                Créez votre première formation avec le bouton Ajouter.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const courseId = item?._id || item?.id;
            const imageUrl =
              item?.thumbnail?.url ||
              item?.thumbnailUrl ||
              item?.categoryId?.image?.url ||
              null;

            const statusStyle = getStatusStyle(item?.status);
            const moduleCount = item?.modules?.length || 0;
            const resourceCount = (item?.modules || []).reduce(
              (total, module) =>
                total + (module?.resources?.length || 0),
              0,
            );

            return (
              <Pressable
                disabled={!courseId}
                onPress={() =>
                  router.push(`/courses/manage/${courseId}`)
                }
                style={({ pressed }) => ({
                  marginBottom: 18,
                  overflow: "hidden",
                  borderRadius: 22,
                  backgroundColor: "#ffffff",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  opacity: pressed ? 0.94 : 1,
                })}
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    resizeMode="cover"
                    style={{
                      width: "100%",
                      height: 185,
                      backgroundColor: "#e2e8f0",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: 185,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#e2e8f0",
                    }}
                  >
                    <Text style={{ color: "#64748b", fontWeight: "800" }}>
                      Image indisponible
                    </Text>
                  </View>
                )}

                <View style={{ padding: 18 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 20,
                        fontWeight: "900",
                        color: "#0f172a",
                      }}
                    >
                      {item?.title || "Cours sans titre"}
                    </Text>

                    <Text
                      style={{
                        borderRadius: 999,
                        paddingHorizontal: 11,
                        paddingVertical: 5,
                        overflow: "hidden",
                        backgroundColor: statusStyle.backgroundColor,
                        color: statusStyle.color,
                        fontSize: 12,
                        fontWeight: "900",
                      }}
                    >
                      {getStatusLabel(item?.status)}
                    </Text>
                  </View>

                  <Text
                    numberOfLines={2}
                    style={{
                      marginTop: 8,
                      color: "#64748b",
                      lineHeight: 20,
                    }}
                  >
                    {item?.description || "Aucune description."}
                  </Text>

                  <Text
                    style={{
                      marginTop: 10,
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {item?.categoryId?.name || "Sans catégorie"}
                  </Text>

                  <View
                    style={{
                      marginTop: 16,
                      flexDirection: "row",
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        backgroundColor: "#f8fafc",
                        padding: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "900",
                          color: "#0f172a",
                        }}
                      >
                        {moduleCount}
                      </Text>
                      <Text style={{ marginTop: 3, color: "#64748b", fontSize: 12 }}>
                        Modules
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        backgroundColor: "#f8fafc",
                        padding: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "900",
                          color: "#0f172a",
                        }}
                      >
                        {resourceCount}
                      </Text>
                      <Text style={{ marginTop: 3, color: "#64748b", fontSize: 12 }}>
                        Ressources
                      </Text>
                    </View>
                  </View>

                  <Text style={{ marginTop: 16, color: "#4f46e5", fontWeight: "900" }}>
                    Gérer le cours
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
