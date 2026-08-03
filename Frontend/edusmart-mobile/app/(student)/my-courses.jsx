import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "../../src/contexts/AuthContext";
import { getStudentCourses } from "../../src/services/course.service";

export default function MyCoursesPage() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getStudentCourses(token);

        if (active) {
          setCourses(data.courses || []);
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

  return (
    <View
      style={{
        flex: 1,
        paddingTop: 52,
        paddingHorizontal: 18,
        backgroundColor: "#f8fafc",
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Mes cours
      </Text>

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color="#4f46e5"
        />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) =>
            String(item.enrollmentId || item.course?._id)
          }
          contentContainerStyle={{
            paddingVertical: 18,
            paddingBottom: 100,
          }}
          ListEmptyComponent={
            <Text
              style={{
                marginTop: 40,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              Aucun cours acheté.
            </Text>
          }
          renderItem={({ item }) => {
            const course = item.course;

            const imageUrl =
              course?.thumbnail?.url ||
              course?.thumbnailUrl ||
              null;

            return (
              <Pressable
                onPress={() =>
                  router.push(`/courses/player/${course._id}`)
                }
                style={{
                  marginBottom: 18,
                  overflow: "hidden",
                  borderRadius: 22,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    resizeMode="cover"
                    style={{
                      width: "100%",
                      height: 180,
                      backgroundColor: "#e2e8f0",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: 180,
                      backgroundColor: "#e2e8f0",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#64748b",
                        fontWeight: "800",
                      }}
                    >
                      Image indisponible
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    padding: 18,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "900",
                      color: "#0f172a",
                    }}
                  >
                    {course.title}
                  </Text>

                  <Text
                    style={{
                      marginTop: 8,
                      color: "#64748b",
                    }}
                  >
                    {course.instructor?.fullName ??
                      "Formateur EduSmart"}
                  </Text>

                  <Text
                    style={{
                      marginTop: 6,
                      color: "#64748b",
                    }}
                  >
                    Plan {item.planType} · Accès actif
                  </Text>

                  <Text
                    style={{
                      marginTop: 14,
                      color: "#4f46e5",
                      fontWeight: "900",
                    }}
                  >
                    Continuer le cours
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