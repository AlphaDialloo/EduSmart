import { ActivityIndicator, Alert, Modal, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../src/contexts/AuthContext";
import { addCourseModule, addCourseResource, archiveInstructorCourse, deleteCourseModule, deleteCourseResource, getInstructorCourse, publishInstructorCourse, unpublishInstructorCourse, updateInstructorCourse } from "../../../src/services/instructor.service";
const EMPTY_MODULE = {
  title: "",
  description: ""
};
const EMPTY_RESOURCE = {
  title: "",
  description: "",
  type: "ARTICLE",
  durationMinutes: "10",
  articleContent: "",
  videoAssetId: "",
  isPreview: false
};
function Section({
  title,
  children
}) {
  return <View style={{
    marginTop: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e7e0d8",
    backgroundColor: "#ffffff",
    padding: 17
  }}>
      <Text style={{
      fontSize: 20,
      fontWeight: "900",
      color: "#292524"
    }}>
        {title}
      </Text>

      {children}
    </View>;
}
function Input({
  label,
  multiline = false,
  ...props
}) {
  return <View style={{
    marginTop: 14
  }}>
      <Text style={{
      marginBottom: 7,
      color: "#57534e",
      fontWeight: "800"
    }}>
        {label}
      </Text>

      <TextInput {...props} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} style={{
      minHeight: multiline ? 110 : 50,
      borderWidth: 1,
      borderColor: "#d6cec4",
      borderRadius: 15,
      paddingHorizontal: 14,
      paddingVertical: multiline ? 12 : 0,
      color: "#292524",
      backgroundColor: "#fff"
    }} />
    </View>;
}
function Choice({
  active,
  label,
  onPress
}) {
  return <Pressable onPress={onPress} style={{
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: active ? "#0f766e" : "#d6cec4",
    backgroundColor: active ? "#ecfdf5" : "#ffffff",
    paddingHorizontal: 8
  }}>
      <Text style={{
      color: active ? "#115e59" : "#57534e",
      fontWeight: "900"
    }}>
        {label}
      </Text>
    </Pressable>;
}
export default function ManageCoursePage() {
  const {
    id
  } = useLocalSearchParams();
  const {
    token
  } = useAuth();
  const [course, setCourse] = useState(null);
  const [level, setLevel] = useState("BEGINNER");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [moduleModal, setModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [resourceModal, setResourceModal] = useState(false);
  const [resourceModuleId, setResourceModuleId] = useState(null);
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE);
  const load = useCallback(async ({
    refresh = false
  } = {}) => {
    if (!token || !id) {
      return;
    }
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError("");
      const data = await getInstructorCourse(token, id);
      const item = data?.course || data;
      setCourse(item);
      setLevel(item?.level || "BEGINNER");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Impossible de charger le cours.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, id]);
  useEffect(() => {
    load();
  }, [load]);
  const resourceCount = useMemo(() => (course?.modules || []).reduce((total, module) => total + (module.resources?.length || 0), 0), [course]);
  async function saveLevel() {
    try {
      setBusy(true);
      setError("");
      await updateInstructorCourse(token, id, {
        level
      });
      await load();
      Alert.alert("Niveau modifié");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de modifier le niveau.");
    } finally {
      setBusy(false);
    }
  }
  async function createModule() {
    if (moduleForm.title.trim().length < 2) {
      setError("Le titre du module est obligatoire.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await addCourseModule(token, id, {
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim() || null,
        order: (course?.modules?.length || 0) + 1,
        isActive: true
      });
      setModuleModal(false);
      setModuleForm(EMPTY_MODULE);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’ajouter le module.");
    } finally {
      setBusy(false);
    }
  }
  async function removeModule(moduleId) {
    Alert.alert("Supprimer le module", "Les ressources de ce module seront également supprimées.", [{
      text: "Annuler",
      style: "cancel"
    }, {
      text: "Supprimer",
      style: "destructive",
      onPress: async () => {
        try {
          setBusy(true);
          await deleteCourseModule(token, id, moduleId);
          await load();
        } catch (requestError) {
          setError(requestError.response?.data?.message || "Suppression impossible.");
        } finally {
          setBusy(false);
        }
      }
    }]);
  }
  function openResource(moduleId) {
    setResourceModuleId(moduleId);
    setResourceForm(EMPTY_RESOURCE);
    setResourceModal(true);
  }
  async function createResource() {
    if (resourceForm.title.trim().length < 2) {
      setError("Le titre de la ressource est obligatoire.");
      return;
    }
    if (resourceForm.type === "ARTICLE" && resourceForm.articleContent.trim().length < 5) {
      setError("Ajoutez le contenu de l’article.");
      return;
    }
    if (resourceForm.type === "VIDEO" && !resourceForm.videoAssetId.trim()) {
      setError("Ajoutez l’identifiant ou l’URL de la vidéo.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      const module = course?.modules?.find(item => String(item._id) === String(resourceModuleId));
      await addCourseResource(token, id, resourceModuleId, {
        title: resourceForm.title.trim(),
        description: resourceForm.description.trim() || null,
        type: resourceForm.type,
        durationMinutes: Number(resourceForm.durationMinutes) || 0,
        articleContent: resourceForm.type === "ARTICLE" ? resourceForm.articleContent.trim() : null,
        videoAssetId: resourceForm.type === "VIDEO" ? resourceForm.videoAssetId.trim() : null,
        order: (module?.resources?.length || 0) + 1,
        isPreview: resourceForm.isPreview,
        isActive: true
      });
      setResourceModal(false);
      setResourceModuleId(null);
      setResourceForm(EMPTY_RESOURCE);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d’ajouter la ressource.");
    } finally {
      setBusy(false);
    }
  }
  async function removeResource(moduleId, resourceId) {
    Alert.alert("Supprimer la ressource", "Cette action est irréversible.", [{
      text: "Annuler",
      style: "cancel"
    }, {
      text: "Supprimer",
      style: "destructive",
      onPress: async () => {
        try {
          setBusy(true);
          await deleteCourseResource(token, id, moduleId, resourceId);
          await load();
        } catch (requestError) {
          setError(requestError.response?.data?.message || "Suppression impossible.");
        } finally {
          setBusy(false);
        }
      }
    }]);
  }
  async function changeStatus(action) {
    try {
      setBusy(true);
      setError("");
      if (action === "publish") {
        await publishInstructorCourse(token, id);
      }
      if (action === "unpublish") {
        await unpublishInstructorCourse(token, id);
      }
      if (action === "archive") {
        await archiveInstructorCourse(token, id);
      }
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de modifier le statut.");
    } finally {
      setBusy(false);
    }
  }
  if (loading) {
    return <View style={{
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#fffbf5"
    }}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>;
  }
  return <>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({
      refresh: true
    })} />} contentContainerStyle={{
      padding: 18,
      paddingTop: 52,
      paddingBottom: 90,
      backgroundColor: "#fffbf5"
    }}>
        <Pressable onPress={() => router.replace("/(instructor)/courses")} style={{
        alignSelf: "flex-start",
        borderRadius: 13,
        backgroundColor: "#d1fae5",
        paddingHorizontal: 14,
        paddingVertical: 10
      }}>
          <Text style={{
          color: "#115e59",
          fontWeight: "900"
        }}>
            Retour aux cours
          </Text>
        </Pressable>

        <Text style={{
        marginTop: 20,
        fontSize: 29,
        fontWeight: "900",
        color: "#292524"
      }}>
          {course?.title || "Gestion du cours"}
        </Text>

        <Text style={{
        marginTop: 7,
        color: "#6b625b"
      }}>
          {course?.status} · {course?.modules?.length || 0} module(s) ·{" "}
          {resourceCount} ressource(s)
        </Text>

        {error ? <View style={{
        marginTop: 16,
        borderRadius: 14,
        backgroundColor: "#fee2e2",
        padding: 13
      }}>
            <Text style={{
          color: "#b91c1c",
          fontWeight: "800"
        }}>
              {error}
            </Text>
          </View> : null}

        <Section title="Niveau du cours">
          <View style={{
          marginTop: 15,
          flexDirection: "row",
          gap: 7
        }}>
            <Choice label="Débutant" active={level === "BEGINNER"} onPress={() => setLevel("BEGINNER")} />

            <Choice label="Intermédiaire" active={level === "INTERMEDIATE"} onPress={() => setLevel("INTERMEDIATE")} />

            <Choice label="Avancé" active={level === "ADVANCED"} onPress={() => setLevel("ADVANCED")} />
          </View>

          <Pressable onPress={saveLevel} disabled={busy || level === course?.level} style={{
          marginTop: 13,
          minHeight: 47,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: "#0f766e",
          opacity: busy || level === course?.level ? 0.5 : 1
        }}>
            <Text style={{
            color: "#fff",
            fontWeight: "900"
          }}>
              Enregistrer le niveau
            </Text>
          </Pressable>
        </Section>

        <Section title="Modules et ressources">
          <Pressable onPress={() => setModuleModal(true)} style={{
          marginTop: 14,
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: "#0f766e"
        }}>
            <Text style={{
            color: "#ffffff",
            fontWeight: "900"
          }}>
              Ajouter un module
            </Text>
          </Pressable>

          {(course?.modules || []).length === 0 ? <Text style={{
          marginTop: 18,
          textAlign: "center",
          color: "#6b625b"
        }}>
              Aucun module pour le moment.
            </Text> : (course?.modules || []).map((module, index) => <View key={module._id} style={{
          marginTop: 15,
          borderRadius: 17,
          backgroundColor: "#fffbf5",
          padding: 14
        }}>
                <Text style={{
            fontSize: 17,
            fontWeight: "900",
            color: "#292524"
          }}>
                  {index + 1}. {module.title}
                </Text>

                {module.description ? <Text style={{
            marginTop: 5,
            color: "#6b625b"
          }}>
                    {module.description}
                  </Text> : null}

                {(module.resources || []).map(resource => <View key={resource._id} style={{
            marginTop: 10,
            borderRadius: 13,
            backgroundColor: "#ffffff",
            padding: 12
          }}>
                      <Text style={{
              fontWeight: "900",
              color: "#292524"
            }}>
                        {resource.title}
                      </Text>

                      <Text style={{
              marginTop: 4,
              color: "#6b625b",
              fontSize: 12
            }}>
                        {resource.type} ·{" "}
                        {resource.durationMinutes || 0} min
                      </Text>

                      <Pressable onPress={() => removeResource(module._id, resource._id)} style={{
              marginTop: 8,
              alignSelf: "flex-start"
            }}>
                        <Text style={{
                color: "#dc2626",
                fontWeight: "800"
              }}>
                          Supprimer
                        </Text>
                      </Pressable>
                    </View>)}

                <View style={{
            marginTop: 12,
            flexDirection: "row",
            gap: 9
          }}>
                  <Pressable onPress={() => openResource(module._id)} style={{
              flex: 1,
              minHeight: 43,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: "#d1fae5"
            }}>
                    <Text style={{
                color: "#115e59",
                fontWeight: "900"
              }}>
                      Ajouter une ressource
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => removeModule(module._id)} style={{
              minHeight: 43,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: "#fee2e2",
              paddingHorizontal: 13
            }}>
                    <Text style={{
                color: "#b91c1c",
                fontWeight: "900"
              }}>
                      Supprimer
                    </Text>
                  </Pressable>
                </View>
              </View>)}
        </Section>

        <Section title="Publication">
          {course?.status === "DRAFT" ? <Pressable onPress={() => changeStatus("publish")} disabled={busy} style={{
          marginTop: 14,
          minHeight: 49,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: "#16a34a"
        }}>
              <Text style={{
            color: "#fff",
            fontWeight: "900"
          }}>
                Publier le cours
              </Text>
            </Pressable> : null}

          {course?.status === "PUBLISHED" ? <Pressable onPress={() => changeStatus("unpublish")} disabled={busy} style={{
          marginTop: 14,
          minHeight: 49,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: "#d97706"
        }}>
              <Text style={{
            color: "#fff",
            fontWeight: "900"
          }}>
                Remettre en brouillon
              </Text>
            </Pressable> : null}

          {course?.status !== "ARCHIVED" ? <Pressable onPress={() => changeStatus("archive")} disabled={busy} style={{
          marginTop: 10,
          minHeight: 49,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: "#334155"
        }}>
              <Text style={{
            color: "#fff",
            fontWeight: "900"
          }}>
                Archiver le cours
              </Text>
            </Pressable> : null}
        </Section>
      </ScrollView>

      <Modal visible={moduleModal} transparent animationType="slide" onRequestClose={() => setModuleModal(false)}>
        <View style={{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(15,23,42,0.45)"
      }}>
          <View style={{
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          backgroundColor: "#fff",
          padding: 20,
          paddingBottom: 35
        }}>
            <Text style={{
            fontSize: 22,
            fontWeight: "900",
            color: "#292524"
          }}>
              Nouveau module
            </Text>

            <Input label="Titre" value={moduleForm.title} onChangeText={value => setModuleForm(current => ({
            ...current,
            title: value
          }))} />

            <Input label="Description" multiline value={moduleForm.description} onChangeText={value => setModuleForm(current => ({
            ...current,
            description: value
          }))} />

            <Pressable onPress={createModule} disabled={busy} style={{
            marginTop: 15,
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 15,
            backgroundColor: "#0f766e"
          }}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{
              color: "#fff",
              fontWeight: "900"
            }}>
                  Ajouter le module
                </Text>}
            </Pressable>

            <Pressable onPress={() => setModuleModal(false)} style={{
            marginTop: 10,
            alignItems: "center",
            padding: 10
          }}>
              <Text style={{
              color: "#6b625b",
              fontWeight: "800"
            }}>
                Annuler
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={resourceModal} transparent animationType="slide" onRequestClose={() => setResourceModal(false)}>
        <View style={{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(15,23,42,0.45)"
      }}>
          <ScrollView contentContainerStyle={{
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          backgroundColor: "#fff",
          padding: 20,
          paddingBottom: 35
        }}>
            <Text style={{
            fontSize: 22,
            fontWeight: "900",
            color: "#292524"
          }}>
              Nouvelle ressource
            </Text>

            <Input label="Titre" value={resourceForm.title} onChangeText={value => setResourceForm(current => ({
            ...current,
            title: value
          }))} />

            <Input label="Description" value={resourceForm.description} onChangeText={value => setResourceForm(current => ({
            ...current,
            description: value
          }))} />

            <Text style={{
            marginTop: 12,
            marginBottom: 8,
            color: "#57534e",
            fontWeight: "800"
          }}>
              Type
            </Text>

            <View style={{
            flexDirection: "row",
            gap: 8
          }}>
              {["ARTICLE", "VIDEO", "EXERCISE"].map(type => <Choice key={type} label={type} active={resourceForm.type === type} onPress={() => setResourceForm(current => ({
              ...current,
              type
            }))} />)}
            </View>

            <Input label="Durée en minutes" keyboardType="number-pad" value={resourceForm.durationMinutes} onChangeText={value => setResourceForm(current => ({
            ...current,
            durationMinutes: value
          }))} />

            {resourceForm.type === "ARTICLE" ? <Input label="Contenu de l’article" multiline value={resourceForm.articleContent} onChangeText={value => setResourceForm(current => ({
            ...current,
            articleContent: value
          }))} /> : null}

            {resourceForm.type === "VIDEO" ? <Input label="Video Asset ID ou URL" value={resourceForm.videoAssetId} onChangeText={value => setResourceForm(current => ({
            ...current,
            videoAssetId: value
          }))} /> : null}

            <View style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
              <Text style={{
              color: "#57534e",
              fontWeight: "800"
            }}>
                Aperçu public
              </Text>

              <Switch value={resourceForm.isPreview} onValueChange={value => setResourceForm(current => ({
              ...current,
              isPreview: value
            }))} />
            </View>

            <Pressable onPress={createResource} disabled={busy} style={{
            marginTop: 20,
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 15,
            backgroundColor: "#0f766e"
          }}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{
              color: "#fff",
              fontWeight: "900"
            }}>
                  Ajouter la ressource
                </Text>}
            </Pressable>

            <Pressable onPress={() => setResourceModal(false)} style={{
            marginTop: 10,
            alignItems: "center",
            padding: 10
          }}>
              <Text style={{
              color: "#6b625b",
              fontWeight: "800"
            }}>
                Annuler
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </>;
}
