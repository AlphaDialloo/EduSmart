import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../src/contexts/AuthContext";
import { getStudentCourseById, getStudentQuiz, submitStudentQuiz } from "../../../src/services/course.service";
import { ensureProgressEnrollment, getEnrollmentProgress, getLearningReflections, getMyEnrollments, saveLearningReflection, saveResourceProgress } from "../../../src/services/progress.service";
export default function CoursePlayerPage() {
  const {
    id
  } = useLocalSearchParams();
  const {
    token
  } = useAuth();
  const [data, setData] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [completedResources, setCompletedResources] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [reflections, setReflections] = useState([]);
  const [reflectionModuleId, setReflectionModuleId] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionMessage, setReflectionMessage] = useState("");
  const [reflectionSaved, setReflectionSaved] = useState(false);
  useEffect(() => {
    async function load() {
      try {
        setError("");
        const [response, progressResponse] = await Promise.all([getStudentCourseById(token, id), getMyEnrollments(token).catch(() => ({
          enrollments: []
        }))]);
        setData(response);
        let progressEnrollment = (progressResponse.enrollments || []).find(item => String(item.course_id) === String(id));
        if (!progressEnrollment) {
          const created = await ensureProgressEnrollment(token, id, response.course?.title || "Cours EduSmart");
          progressEnrollment = created.enrollment;
        }
        setEnrollmentId(progressEnrollment?.id || null);
        setOverallProgress(Number(progressEnrollment?.progress_percentage || 0));
        if (progressEnrollment?.id) {
          const [saved, reflectionResponse] = await Promise.all([
            getEnrollmentProgress(token, progressEnrollment.id).catch(() => null),
            getLearningReflections(token, progressEnrollment.id).catch(() => ({ reflections: [] }))
          ]);
          setCompletedResources((saved?.resources || []).filter(item => item.completed === true).map(item => String(item.resource_id)));
          setOverallProgress(Number(saved?.enrollment?.progress_percentage || 0));
          setReflections(reflectionResponse.reflections || []);
        }
        setReflectionModuleId(String(response.course?.modules?.[0]?._id || ""));
        const firstResource = response.course?.modules?.[0]?.resources?.[0];
        setSelectedResourceId(firstResource?._id || null);
      } catch (requestError) {
        setError(requestError.response?.data?.message || (requestError.message === "Network Error" ? "Le téléphone ne peut pas joindre l’API EduSmart. Vérifiez le Wi-Fi." : requestError.message) || "Impossible de charger ce cours.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);
  const allResources = useMemo(() => (data?.course?.modules || []).flatMap(module => (module.resources || []).map(resource => ({
    ...resource,
    moduleId: module._id
  }))), [data]);
  const selectedResource = useMemo(() => {
    for (const module of data?.course?.modules || []) {
      const resource = module.resources?.find(item => String(item._id) === String(selectedResourceId));
      if (resource) {
        return resource;
      }
    }
    return null;
  }, [data, selectedResourceId]);
  const selectedWithModule = useMemo(() => allResources.find(item => String(item._id) === String(selectedResourceId)), [allResources, selectedResourceId]);
  const resourceUrl = selectedResource?.video?.url || selectedResource?.file?.url || selectedResource?.file?.downloadUrl || selectedResource?.image?.url || selectedResource?.externalUrl;
  useEffect(() => {
    const saved = reflections.find(item => String(item.module_id) === String(reflectionModuleId));
    setReflectionText(saved?.summary || "");
    setConfidenceLevel(Number(saved?.confidence_level || 3));
  }, [reflectionModuleId, reflections]);
  async function completeResource() {
    if (!selectedWithModule || !enrollmentId || saving) return;
    try {
      setSaving(true);
      setError("");
      const response = await saveResourceProgress(token, {
        enrollmentId,
        moduleId: selectedWithModule.moduleId,
        resourceId: selectedWithModule._id,
        totalResources: Math.max(allResources.length, 1),
        progressPercentage: 100,
        completed: true
      });
      setCompletedResources(current => [...new Set([...current, String(selectedWithModule._id)])]);
      setOverallProgress(Number(response?.progressSummary?.overallProgress ?? response?.enrollment?.progress_percentage ?? overallProgress));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’enregistrer la progression.");
    } finally {
      setSaving(false);
    }
  }
  async function selectQuiz(quizMeta) {
    try {
      setQuizLoading(true);
      setError("");
      setQuizAnswers({});
      setQuizResult(null);
      setSelectedResourceId(quizMeta._id);
      const response = await getStudentQuiz(token, id, quizMeta._id);
      setQuiz(response.quiz);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de charger le quiz.");
    } finally {
      setQuizLoading(false);
    }
  }
  function chooseAnswer(question, optionId) {
    const questionId = String(question.id || question._id);
    const normalized = String(optionId);
    const multiple = String(question.type).toUpperCase() === "MULTIPLE_CHOICE";
    setQuizAnswers(current => {
      const selected = current[questionId] || [];
      return {
        ...current,
        [questionId]: multiple ? selected.includes(normalized) ? selected.filter(value => value !== normalized) : [...selected, normalized] : [normalized]
      };
    });
  }
  async function submitQuiz() {
    try {
      setSaving(true);
      const answers = (quiz.questions || []).map(question => ({
        questionId: String(question.id || question._id),
        selectedOptionIds: quizAnswers[String(question.id || question._id)] || []
      }));
      const response = await submitStudentQuiz(token, id, quiz.id, answers);
      setQuizResult(response.result);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de soumettre le quiz.");
    } finally {
      setSaving(false);
    }
  }
  async function saveReflection() {
    const module = (data?.course?.modules || []).find(item => String(item._id) === String(reflectionModuleId));
    if (!module || !enrollmentId || reflectionText.trim().length < 10) {
      setReflectionMessage("Écris au moins 10 caractères pour expliquer ce que tu as compris.");
      return;
    }
    try {
      setSavingReflection(true);
      setReflectionMessage("");
      const response = await saveLearningReflection(token, enrollmentId, reflectionModuleId, {
        moduleTitle: module.title,
        summary: reflectionText.trim(),
        confidenceLevel
      });
      setReflections(current => [response.reflection, ...current.filter(item => String(item.module_id) !== String(reflectionModuleId))]);
      setReflectionMessage("Ton résumé a bien été enregistré.");
      setReflectionSaved(true);
    } catch (requestError) {
      setReflectionMessage(requestError.response?.data?.message || "Impossible d’enregistrer le résumé.");
    } finally {
      setSavingReflection(false);
    }
  }
  if (loading) {
    return <View style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    }}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>;
  }
  if (error && !data) {
    return <View style={{
      flex: 1,
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fffbf5"
    }}>
        <Text style={{
        color: "#991b1b",
        textAlign: "center",
        fontWeight: "800",
        lineHeight: 22
      }}>{error}</Text>
        <Pressable onPress={() => router.back()} style={{
        marginTop: 20,
        borderRadius: 14,
        backgroundColor: "#0f766e",
        paddingHorizontal: 22,
        paddingVertical: 14
      }}>
          <Text style={{
          color: "#fff",
          fontWeight: "900"
        }}>Retour à mes cours</Text>
        </Pressable>
      </View>;
  }
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#fffbf5" }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{
    padding: 18,
    paddingTop: 16,
    backgroundColor: "#fffbf5",
    minHeight: "100%"
  }}>
      <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(student)/my-courses")} style={{
      alignSelf: "flex-start",
      marginBottom: 20,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: "#d1fae5"
    }}>
        <Text style={{
        color: "#115e59",
        fontWeight: "900",
        fontSize: 16
      }}>
          ← Retour à mes cours
        </Text>
      </Pressable>

      <Text style={{
      fontSize: 27,
      fontWeight: "900",
      color: "#292524"
    }}>
        {data?.course?.title}
      </Text>

      <Text style={{
      marginTop: 10,
      color: "#0f766e",
      fontWeight: "900"
    }}>
        Progression : {Math.round(overallProgress)} %
      </Text>
      <View style={{
      marginTop: 8,
      height: 9,
      overflow: "hidden",
      borderRadius: 999,
      backgroundColor: "#e7e0d8"
    }}>
        <View style={{
        width: `${Math.min(100, overallProgress)}%`,
        height: "100%",
        backgroundColor: "#0f766e"
      }} />
      </View>

      <Pressable onPress={() => router.push(`/courses/forum/${id}`)} style={{
      marginTop: 16,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#a7f3d0"
    }}>
        <Text style={{
        color: "#115e59",
        fontWeight: "900"
      }}>Discuter dans le forum du cours</Text>
      </Pressable>

      {error ? <Text style={{
      marginTop: 14,
      borderRadius: 12,
      padding: 12,
      color: "#991b1b",
      backgroundColor: "#fee2e2",
      fontWeight: "800"
    }}>{error}</Text> : null}

      <View style={{
      marginTop: 20,
      borderRadius: 20,
      backgroundColor: "#fff",
      padding: 18
    }}>
        <Text style={{
        fontSize: 18,
        fontWeight: "900",
        color: "#292524"
      }}>
          {quiz?.title || selectedResource?.title || "Sélectionne une ressource"}
        </Text>

        <Text style={{
        marginTop: 8,
        color: "#6b625b",
        lineHeight: 21
      }}>
          {selectedResource?.type === "ARTICLE" ? selectedResource.articleContent : selectedResource?.description || "La lecture vidéo et PDF sera branchée dans la prochaine étape."}
        </Text>

        {quizLoading ? <ActivityIndicator style={{
        marginTop: 18
      }} color="#7c3aed" /> : null}
        {quiz ? <View style={{
        marginTop: 16
      }}>
            {(quiz.questions || []).map((question, index) => {
          const questionId = String(question.id || question._id);
          return <View key={questionId} style={{
            marginBottom: 18
          }}>
                  <Text style={{
              fontWeight: "900",
              color: "#292524"
            }}>{index + 1}. {question.question}</Text>
                  {(question.options || []).map(option => {
              const optionId = String(option.id || option._id);
              const selected = (quizAnswers[questionId] || []).includes(optionId);
              return <Pressable key={optionId} onPress={() => chooseAnswer(question, optionId)} style={{
                marginTop: 8,
                borderRadius: 12,
                padding: 12,
                backgroundColor: selected ? "#ede9fe" : "#fffbf5",
                borderWidth: 1,
                borderColor: selected ? "#8b5cf6" : "#e7e0d8"
              }}>
                        <Text style={{
                  color: "#334155",
                  fontWeight: selected ? "900" : "600"
                }}>{selected ? "✓ " : ""}{option.text}</Text>
                      </Pressable>;
            })}
                </View>;
        })}
            <Pressable disabled={saving} onPress={submitQuiz} style={{
          borderRadius: 14,
          padding: 14,
          alignItems: "center",
          backgroundColor: "#7c3aed"
        }}>
              <Text style={{
            color: "#fff",
            fontWeight: "900"
          }}>{saving ? "Correction..." : "Soumettre le quiz"}</Text>
            </Pressable>
            {quizResult ? <View style={{
          marginTop: 14,
          borderRadius: 14,
          padding: 14,
          backgroundColor: quizResult.passed ? "#d1fae5" : "#fef3c7"
        }}>
                <Text style={{
            fontWeight: "900",
            color: "#292524"
          }}>Résultat : {quizResult.score} % · {quizResult.passed ? "Réussi" : "À reprendre"}</Text>
              </View> : null}
          </View> : null}

        {resourceUrl ? <Pressable onPress={() => Linking.openURL(resourceUrl)} style={{
        marginTop: 16,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        backgroundColor: "#d1fae5"
      }}>
            <Text style={{
          color: "#115e59",
          fontWeight: "900"
        }}>Ouvrir la ressource</Text>
          </Pressable> : null}

        {selectedResource && selectedResource.type !== "QUIZ" ? <Pressable disabled={!enrollmentId || saving || completedResources.includes(String(selectedResource._id))} onPress={completeResource} style={{
        marginTop: 12,
        borderRadius: 14,
        padding: 14,
        alignItems: "center",
        backgroundColor: completedResources.includes(String(selectedResource._id)) ? "#059669" : "#0f766e",
        opacity: !enrollmentId ? 0.55 : 1
      }}>
            <Text style={{
          color: "#fff",
          fontWeight: "900"
        }}>
              {completedResources.includes(String(selectedResource._id)) ? "Ressource terminée" : saving ? "Enregistrement..." : enrollmentId ? "Marquer comme terminé" : "Progression non disponible"}
            </Text>
          </Pressable> : null}
      </View>

      <View style={{
      marginTop: 20,
      borderRadius: 20,
      backgroundColor: "#fff",
      padding: 18,
      borderWidth: 1,
      borderColor: "#a7f3d0"
    }}>
        <Text style={{
        color: "#0f766e",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 1.2,
        textTransform: "uppercase"
      }}>Carnet de compréhension</Text>
        <Text style={{
        marginTop: 5,
        color: "#292524",
        fontSize: 22,
        fontWeight: "900"
      }}>Ce que j’ai retenu</Text>
        <Text style={{
        marginTop: 7,
        color: "#6b625b",
        lineHeight: 21
      }}>Après une notion ou un quiz, reformule l’essentiel avec tes propres mots.</Text>

        <Text style={{
        marginTop: 18,
        color: "#292524",
        fontWeight: "900"
      }}>Notion étudiée</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {(data?.course?.modules || []).map(module => {
          const selected = String(module._id) === String(reflectionModuleId);
          return <Pressable key={module._id} onPress={() => {
            setReflectionModuleId(String(module._id));
            setReflectionSaved(false);
            setReflectionMessage("");
          }} style={{
            marginRight: 8,
            borderRadius: 999,
            paddingHorizontal: 14,
            paddingVertical: 10,
            backgroundColor: selected ? "#0f766e" : "#ecfdf5"
          }}>
              <Text style={{ color: selected ? "#fff" : "#115e59", fontWeight: "900" }}>{module.title}</Text>
            </Pressable>;
        })}
        </ScrollView>

        <TextInput multiline value={reflectionText} onChangeText={value => {
        setReflectionText(value);
        setReflectionSaved(false);
        setReflectionMessage("");
      }} maxLength={4000} placeholder="Explique la notion, les idées importantes et donne un exemple..." placeholderTextColor="#9a918b" textAlignVertical="top" style={{
        marginTop: 14,
        minHeight: 150,
        borderRadius: 16,
        padding: 14,
        color: "#292524",
        lineHeight: 22,
        backgroundColor: "#fffbf5",
        borderWidth: 1,
        borderColor: "#e7e0d8"
      }} />
        <Text style={{ marginTop: 6, color: "#9a918b", textAlign: "right", fontSize: 12 }}>{reflectionText.length} / 4 000</Text>

        <Text style={{ marginTop: 14, color: "#292524", fontWeight: "900" }}>Mon niveau de confiance</Text>
        <View style={{ marginTop: 9, flexDirection: "row", gap: 7 }}>
          {[1, 2, 3, 4, 5].map(level => <Pressable key={level} onPress={() => {
          setConfidenceLevel(level);
          setReflectionSaved(false);
          setReflectionMessage("");
        }} style={{
          flex: 1,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: "center",
          backgroundColor: confidenceLevel === level ? "#0f766e" : "#f1f5f9"
        }}><Text style={{ color: confidenceLevel === level ? "#fff" : "#64748b", fontWeight: "900" }}>{level}</Text></Pressable>)}
        </View>

        {reflectionMessage ? <Text style={{
        marginTop: 12,
        color: reflectionMessage.includes("bien été") ? "#047857" : "#991b1b",
        fontWeight: "800"
      }}>{reflectionMessage}</Text> : null}
        <Pressable disabled={savingReflection || !enrollmentId} onPress={saveReflection} style={{
        marginTop: 15,
        borderRadius: 14,
        padding: 15,
        alignItems: "center",
        backgroundColor: reflectionSaved ? "#059669" : "#292524",
        opacity: savingReflection || !enrollmentId ? 0.55 : 1
      }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>{savingReflection ? "Enregistrement..." : reflectionSaved ? "Résumé enregistré ✓" : "Enregistrer mon résumé"}</Text>
        </Pressable>

        {reflections.length ? <View style={{
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: "#e7e0d8"
      }}>
            <Text style={{ color: "#292524", fontSize: 19, fontWeight: "900" }}>Mes résumés enregistrés</Text>
            <Text style={{ marginTop: 5, color: "#6b625b", lineHeight: 20 }}>Touche un résumé pour le relire ou le modifier.</Text>
            {reflections.map(reflection => {
          const selected = String(reflection.module_id) === String(reflectionModuleId);
          return <Pressable key={reflection.id} onPress={() => {
            setReflectionModuleId(String(reflection.module_id));
            setReflectionText(reflection.summary);
            setConfidenceLevel(Number(reflection.confidence_level || 3));
            setReflectionSaved(true);
            setReflectionMessage("");
          }} style={{
            marginTop: 10,
            borderRadius: 15,
            padding: 14,
            backgroundColor: selected ? "#ecfdf5" : "#fffbf5",
            borderWidth: 1,
            borderColor: selected ? "#6ee7b7" : "#e7e0d8"
          }}>
                <Text style={{ color: "#292524", fontWeight: "900" }}>{reflection.module_title}</Text>
                <Text numberOfLines={2} style={{ marginTop: 6, color: "#6b625b", lineHeight: 20 }}>{reflection.summary}</Text>
                <Text style={{ marginTop: 7, color: "#0f766e", fontSize: 12, fontWeight: "900" }}>Confiance {reflection.confidence_level}/5</Text>
              </Pressable>;
        })}
          </View> : null}
      </View>

      {(data?.course?.modules || []).map(module => <View key={module._id} style={{
      marginTop: 18
    }}>
          <Text style={{
        fontSize: 19,
        fontWeight: "900",
        color: "#292524"
      }}>
            {module.title}
          </Text>

          {(module.resources || []).map(resource => <Pressable key={resource._id} onPress={() => {
        setQuiz(null);
        setQuizResult(null);
        setSelectedResourceId(resource._id);
      }} style={{
        marginTop: 10,
        borderRadius: 16,
        padding: 15,
        backgroundColor: String(resource._id) === String(selectedResourceId) ? "#d1fae5" : "#fff"
      }}>
              <Text style={{
          fontWeight: "900",
          color: "#292524"
        }}>
                {resource.title}
              </Text>
              <Text style={{
          marginTop: 4,
          color: "#6b625b"
        }}>
                {resource.type}
              </Text>
            </Pressable>)}
        </View>)}

      {(data?.course?.quizzes || []).length ? <View style={{
      marginTop: 24
    }}>
          <Text style={{
        fontSize: 20,
        fontWeight: "900",
        color: "#292524"
      }}>Quiz du cours</Text>
          {(data.course.quizzes || []).map(quizMeta => <Pressable key={quizMeta._id} onPress={() => selectQuiz(quizMeta)} style={{
        marginTop: 10,
        borderRadius: 16,
        padding: 15,
        backgroundColor: String(quizMeta._id) === String(selectedResourceId) ? "#ede9fe" : "#fff"
      }}>
              <Text style={{
          fontWeight: "900",
          color: "#292524"
        }}>{quizMeta.title}</Text>
              <Text style={{
          marginTop: 4,
          color: "#7c3aed"
        }}>Commencer le quiz</Text>
            </Pressable>)}
        </View> : null}
    </ScrollView></SafeAreaView>;
}
