import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { getStudentCourses } from "../../src/services/course.service";
import { getMyEnrollments } from "../../src/services/progress.service";
export default function MyCoursesPage() {
  const {
    token
  } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError("");
        const [data, progressData] = await Promise.all([getStudentCourses(token), getMyEnrollments(token).catch(() => ({
          enrollments: []
        }))]);
        const progressByCourse = new Map((progressData.enrollments || []).map(item => [String(item.course_id), item]));
        if (active) {
          setCourses((data.courses || []).map(item => ({
            ...item,
            progressEnrollment: progressByCourse.get(String(item.course?._id || item.courseId))
          })));
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || (requestError.message === "Network Error" ? "Le téléphone ne peut pas joindre l’API EduSmart. Vérifiez le Wi-Fi." : requestError.message) || "Impossible de charger vos cours.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token, refreshing]);
  return <View style={{
    flex: 1,
    paddingTop: 52,
    paddingHorizontal: 18,
    backgroundColor: "#fffbf5"
  }}>
      <Text style={{
      fontSize: 30,
      fontWeight: "900",
      color: "#292524"
    }}>
        Mes cours
      </Text>

      {error ? <View style={{
      marginTop: 18,
      borderRadius: 16,
      backgroundColor: "#fee2e2",
      padding: 16
    }}>
          <Text style={{
        color: "#991b1b",
        fontWeight: "800",
        lineHeight: 20
      }}>{error}</Text>
          <Pressable onPress={() => {
        setLoading(true);
        setRefreshing(value => !value);
      }}>
            <Text style={{
          marginTop: 12,
          color: "#0f766e",
          fontWeight: "900"
        }}>Réessayer</Text>
          </Pressable>
        </View> : null}

      {loading ? <ActivityIndicator style={{
      marginTop: 40
    }} size="large" color="#0f766e" /> : <FlatList data={courses} keyExtractor={item => String(item.enrollmentId || item.course?._id)} contentContainerStyle={{
      paddingVertical: 18,
      paddingBottom: 100
    }} onRefresh={() => setRefreshing(value => !value)} refreshing={false} ListEmptyComponent={<Text style={{
      marginTop: 40,
      textAlign: "center",
      color: "#6b625b"
    }}>
              Aucun cours acheté.
            </Text>} renderItem={({
      item
    }) => {
      const course = item.course;
      const progress = Math.min(100, Math.max(0, Number(item.progressEnrollment?.progress_percentage || 0)));
      const imageUrl = course?.thumbnail?.url || course?.thumbnailUrl || null;
      return <Pressable onPress={() => router.push(`/courses/player/${course._id}`)} style={{
        marginBottom: 18,
        overflow: "hidden",
        borderRadius: 22,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e7e0d8"
      }}>
                {imageUrl ? <Image source={{
          uri: imageUrl
        }} resizeMode="cover" style={{
          width: "100%",
          height: 180,
          backgroundColor: "#e7e0d8"
        }} /> : <View style={{
          width: "100%",
          height: 180,
          backgroundColor: "#e7e0d8",
          justifyContent: "center",
          alignItems: "center"
        }}>
                    <Text style={{
            color: "#6b625b",
            fontWeight: "800"
          }}>
                      Image indisponible
                    </Text>
                  </View>}

                <View style={{
          padding: 18
        }}>
                  <Text style={{
            fontSize: 20,
            fontWeight: "900",
            color: "#292524"
          }}>
                    {course.title}
                  </Text>

                  <Text style={{
            marginTop: 8,
            color: "#6b625b"
          }}>
                    {course.instructor?.fullName ?? "Formateur EduSmart"}
                  </Text>

                  <Text style={{
            marginTop: 6,
            color: "#6b625b"
          }}>
                    Plan {item.planType} · Accès actif
                  </Text>

                  <View style={{
            marginTop: 14,
            height: 8,
            overflow: "hidden",
            borderRadius: 999,
            backgroundColor: "#e7e0d8"
          }}>
                    <View style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#0f766e"
            }} />
                  </View>
                  <Text style={{
            marginTop: 7,
            color: "#57534e",
            fontWeight: "700"
          }}>
                    Progression : {Math.round(progress)} %
                  </Text>

                  <Text style={{
            marginTop: 14,
            color: "#0f766e",
            fontWeight: "900"
          }}>
                    Continuer le cours
                  </Text>
                </View>
              </Pressable>;
    }} />}
    </View>;
}
