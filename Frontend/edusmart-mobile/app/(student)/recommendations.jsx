import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/contexts/AuthContext";
import { getRecommendations } from "../../src/services/recommendation.service";
export default function RecommendationsPage() {
  const {
    token
  } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    getRecommendations(token).then(data => active && setItems(data.recommendations || [])).catch(requestError => active && setError(requestError.response?.data?.message || "Impossible de générer les recommandations.")).finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, reload]);
  return <SafeAreaView edges={["top"]} style={{
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    backgroundColor: "#fffbf5"
  }}>
      <Text style={{
      fontSize: 29,
      fontWeight: "900",
      color: "#292524"
    }}>Pour vous</Text>
      <Text style={{
      marginTop: 6,
      color: "#6b625b"
    }}>Cours adaptés à votre profil et à vos résultats.</Text>
      {loading ? <ActivityIndicator style={{
      marginTop: 40
    }} size="large" color="#0f766e" /> : <FlatList data={items} keyExtractor={item => String(item.id || item.course_id)} contentContainerStyle={{
      paddingVertical: 18,
      paddingBottom: 100
    }} ListEmptyComponent={<View style={{
      marginTop: 30,
      alignItems: "center"
    }}>
              <Text style={{
        color: error ? "#991b1b" : "#6b625b",
        textAlign: "center"
      }}>{error || "Aucune recommandation pour le moment."}</Text>
              <Pressable onPress={() => {
        setLoading(true);
        setError("");
        setReload(value => value + 1);
      }}>
                <Text style={{
          marginTop: 16,
          color: "#0f766e",
          fontWeight: "900"
        }}>Actualiser</Text>
              </Pressable>
            </View>} renderItem={({
      item
    }) => <Pressable onPress={() => router.push(`/courses/${item.course_id}`)} style={{
      marginBottom: 14,
      borderRadius: 20,
      padding: 18,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#e7e0d8"
    }}>
              <Text style={{
        fontSize: 19,
        fontWeight: "900",
        color: "#292524"
      }}>{item.courseTitle || "Cours recommandé"}</Text>
              <Text style={{
        marginTop: 8,
        color: "#6b625b",
        lineHeight: 20
      }}>{item.reason}</Text>
              <Text style={{
        marginTop: 12,
        color: "#0f766e",
        fontWeight: "900"
      }}>Compatibilité : {Math.round(Number(item.recommendation_score || 0))} %</Text>
            </Pressable>} />}
    </SafeAreaView>;
}
