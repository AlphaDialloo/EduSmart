import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { listPublishedCourses } from "../../src/services/course.service";

export default function CataloguePage() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await listPublishedCourses({
          search,
          limit: 30,
        });

        if (active) {
          setCourses(data.courses || []);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Impossible de charger les cours.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(load, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

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
        Catalogue
      </Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un cours..."
        style={{
          marginTop: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#e2e8f0",
          backgroundColor: "#fff",
          paddingHorizontal: 16,
          paddingVertical: 13,
        }}
      />

      {error ? (
        <View
          style={{
            marginTop: 16,
            borderRadius: 16,
            backgroundColor: "#fee2e2",
            padding: 14,
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
            String(item._id || item.id)
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
              Aucun cours trouvé.
            </Text>
          }
          renderItem={({ item }) => {
            const imageUrl =
              item.thumbnail?.url ||
              item.thumbnailUrl ||
              item.categoryId?.image?.url ||
              null;

            const activePlans =
              item.pricing?.accessPlans?.filter(
                (plan) => plan.isActive !== false,
              ) || [];

            const lowestPrice = activePlans.length
              ? Math.min(
                  ...activePlans.map((plan) =>
                    Number(plan.price || 0),
                  ),
                )
              : null;

            return (
              <Pressable
                onPress={() =>
                  router.push(
                    `/courses/${item._id || item.id}`,
                  )
                }
                style={{
                  marginBottom: 16,
                  overflow: "hidden",
                  borderRadius: 22,
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                }}
              >
                {imageUrl ? (
                  <Image
                    source={{
                      uri: imageUrl,
                    }}
                    resizeMode="cover"
                    style={{
                      width: "100%",
                      height: 190,
                      backgroundColor: "#e2e8f0",
                    }}
                    onError={(event) => {
                      console.log(
                        "Erreur image du cours :",
                        imageUrl,
                        event.nativeEvent.error,
                      );
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: 190,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#e2e8f0",
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
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 19,
                        fontWeight: "900",
                        color: "#0f172a",
                      }}
                    >
                      {item.title}
                    </Text>

                    {item.pricing?.isFree ? (
                      <Text
                        style={{
                          color: "#059669",
                          fontWeight: "900",
                        }}
                      >
                        Gratuit
                      </Text>
                    ) : lowestPrice !== null ? (
                      <Text
                        style={{
                          color: "#4f46e5",
                          fontWeight: "900",
                        }}
                      >
                        {lowestPrice.toFixed(2)}{" "}
                        {item.pricing?.baseCurrency ||
                          "CAD"}
                      </Text>
                    ) : null}
                  </View>

                  <Text
                    numberOfLines={2}
                    style={{
                      marginTop: 8,
                      color: "#64748b",
                      lineHeight: 20,
                    }}
                  >
                    {item.description}
                  </Text>

                  <Text
                    style={{
                      marginTop: 10,
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    {item.instructor?.fullName ||
                      "Formateur EduSmart"}{" "}
                    · {item.level}
                  </Text>

                  <Text
                    style={{
                      marginTop: 12,
                      color: "#4f46e5",
                      fontWeight: "900",
                    }}
                  >
                    Voir le cours
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