import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { enrollFreeCourse, getCourseById } from "../../src/services/course.service";
import { confirmTestPayment, createCoursePayment } from "../../src/services/payment.service";

const price = (value, currency) => `${Number(value || 0).toFixed(2)} ${currency || "CAD"}`;

export default function CourseDetailPage() {
  const { id } = useLocalSearchParams();
  const { token, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCourseById(id).then(data => {
      if (active) setCourse(data.course || data);
    }).catch(requestError => {
      if (active) setError(requestError.response?.data?.message || "Impossible de charger ce cours.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const plans = useMemo(() => (course?.pricing?.accessPlans || []).filter(plan => plan.isActive !== false).sort((a, b) => Number(a.price) - Number(b.price)), [course]);

  useEffect(() => {
    setSelectedPlan(plans[0] || null);
  }, [plans]);

  async function completeEnrollment() {
    if (!token) {
      router.push("/(auth)/login");
      return;
    }
    try {
      setProcessing(true);
      setError("");
      const courseId = String(course._id || course.id || id);
      const isFree = course.pricing?.isFree || course.isFree;
      if (isFree) {
        await enrollFreeCourse(token, courseId);
      } else {
        if (!selectedPlan?._id) throw new Error("Sélectionnez un plan d’accès.");
        const result = await createCoursePayment(token, courseId, String(selectedPlan._id), user?.id);
        const paymentId = result.payment?.id;
        if (!paymentId) throw new Error("Le paiement n’a pas été créé.");
        await confirmTestPayment(token, paymentId);
      }
      Alert.alert("Accès confirmé", "Le cours est maintenant disponible dans Mes cours.", [{ text: "Voir mes cours", onPress: () => router.replace("/(student)/my-courses") }]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Impossible de finaliser l’achat.");
    } finally {
      setProcessing(false);
    }
  }

  function confirmEnrollment() {
    const isFree = course.pricing?.isFree || course.isFree;
    const message = isFree ? "Confirmer votre inscription gratuite ?" : `Confirmer le plan ${selectedPlan?.planType || "sélectionné"} à ${price(selectedPlan?.price, course.pricing?.baseCurrency)} ?\n\nMode TEST : aucun débit réel.`;
    Alert.alert(isFree ? "Inscription" : "Acheter ce cours", message, [{ text: "Annuler", style: "cancel" }, { text: "Confirmer", onPress: completeEnrollment }]);
  }

  if (loading) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color="#0f766e" /></View>;
  if (!course) return <View style={{ flex: 1, padding: 24, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#b91c1c", fontWeight: "800" }}>{error || "Cours introuvable."}</Text></View>;

  const isFree = course.pricing?.isFree || course.isFree;
  return <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 50, backgroundColor: "#fffbf5", minHeight: "100%" }}>
      <Pressable onPress={() => router.back()}><Text style={{ color: "#0f766e", fontWeight: "900", fontSize: 16 }}>← Retour au catalogue</Text></Pressable>
      <Text style={{ marginTop: 24, fontSize: 30, fontWeight: "900", color: "#292524" }}>{course.title}</Text>
      <Text style={{ marginTop: 14, color: "#6b625b", lineHeight: 22 }}>{course.description}</Text>
      <View style={{ marginTop: 28, borderRadius: 22, backgroundColor: "#fff", padding: 18, borderWidth: 1, borderColor: "#e7e0d8" }}>
        <Text style={{ fontSize: 21, fontWeight: "900", color: "#292524" }}>{isFree ? "Cours gratuit" : "Choisissez votre formule"}</Text>
        {!isFree && plans.map(plan => {
          const selected = selectedPlan?._id === plan._id;
          return <Pressable key={String(plan._id)} onPress={() => setSelectedPlan(plan)} style={{ marginTop: 14, borderRadius: 16, borderWidth: 2, borderColor: selected ? "#0f766e" : "#e7e0d8", backgroundColor: selected ? "#ecfdf5" : "#fff", padding: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ color: "#292524", fontWeight: "900" }}>{plan.planType}</Text><Text style={{ color: "#0f766e", fontWeight: "900" }}>{price(plan.price, course.pricing?.baseCurrency)}</Text></View>
              <Text style={{ marginTop: 6, color: "#6b625b" }}>Accès pendant {plan.durationMonths} mois</Text>
            </Pressable>;
        })}
        {error ? <Text style={{ marginTop: 16, color: "#b91c1c", fontWeight: "800" }}>{error}</Text> : null}
        <Pressable disabled={processing || (!isFree && !selectedPlan)} onPress={confirmEnrollment} style={{ marginTop: 20, borderRadius: 16, backgroundColor: "#0f766e", paddingVertical: 16, alignItems: "center", opacity: processing || (!isFree && !selectedPlan) ? 0.55 : 1 }}>
          {processing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{isFree ? "S’inscrire gratuitement" : "Acheter ce cours"}</Text>}
        </Pressable>
        {!isFree ? <Text style={{ marginTop: 12, color: "#6b625b", textAlign: "center", fontSize: 12 }}>Paiement TEST : aucun montant réel n’est prélevé.</Text> : null}
      </View>
    </ScrollView>;
}
