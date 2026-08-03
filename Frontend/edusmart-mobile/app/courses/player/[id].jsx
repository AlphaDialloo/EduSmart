import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { useAuth } from "../../../src/contexts/AuthContext";
import { getStudentCourseById } from "../../../src/services/course.service";

export default function CoursePlayerPage() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await getStudentCourseById(token, id);
        setData(response);

        const firstResource =
          response.course?.modules?.[0]?.resources?.[0];

        setSelectedResourceId(firstResource?._id || null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, token]);

  const selectedResource = useMemo(() => {
    for (const module of data?.course?.modules || []) {
      const resource = module.resources?.find(
        (item) => String(item._id) === String(selectedResourceId),
      );

      if (resource) {
        return resource;
      }
    }

    return null;
  }, [data, selectedResourceId]);

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
        padding: 18,
        paddingTop: 52,
        backgroundColor: "#f8fafc",
        minHeight: "100%",
      }}
    >
      <Text style={{ fontSize: 27, fontWeight: "900", color: "#0f172a" }}>
        {data?.course?.title}
      </Text>

      <View
        style={{
          marginTop: 20,
          borderRadius: 20,
          backgroundColor: "#fff",
          padding: 18,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#0f172a" }}>
          {selectedResource?.title || "Sélectionne une ressource"}
        </Text>

        <Text style={{ marginTop: 8, color: "#64748b", lineHeight: 21 }}>
          {selectedResource?.type === "ARTICLE"
            ? selectedResource.articleContent
            : selectedResource?.description ||
              "La lecture vidéo et PDF sera branchée dans la prochaine étape."}
        </Text>
      </View>

      {(data?.course?.modules || []).map((module) => (
        <View key={module._id} style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 19, fontWeight: "900", color: "#0f172a" }}>
            {module.title}
          </Text>

          {(module.resources || []).map((resource) => (
            <Pressable
              key={resource._id}
              onPress={() => setSelectedResourceId(resource._id)}
              style={{
                marginTop: 10,
                borderRadius: 16,
                padding: 15,
                backgroundColor:
                  String(resource._id) === String(selectedResourceId)
                    ? "#e0e7ff"
                    : "#fff",
              }}
            >
              <Text style={{ fontWeight: "900", color: "#0f172a" }}>
                {resource.title}
              </Text>
              <Text style={{ marginTop: 4, color: "#64748b" }}>
                {resource.type}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
