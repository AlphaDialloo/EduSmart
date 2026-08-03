import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { getCourseById } from "../../src/services/course.service";

export default function CourseDetailPage() {
  const { id } = useLocalSearchParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCourseById(id);
        setCourse(data.course);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingTop: 56,
        backgroundColor: "#f8fafc",
        minHeight: "100%",
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: "900", color: "#0f172a" }}>
        {course?.title}
      </Text>

      <Text style={{ marginTop: 14, color: "#64748b", lineHeight: 22 }}>
        {course?.description}
      </Text>

      <Pressable
        onPress={() => router.back()}
        style={{
          marginTop: 24,
          borderRadius: 16,
          backgroundColor: "#e0e7ff",
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#4338ca", fontWeight: "900" }}>
          Retour
        </Text>
      </Pressable>
    </ScrollView>
  );
}
