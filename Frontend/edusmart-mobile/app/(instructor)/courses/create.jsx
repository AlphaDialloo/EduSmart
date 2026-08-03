import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../../src/contexts/AuthContext";
import {
  createInstructorCourse,
  getCourseCategories,
  uploadCourseThumbnail,
} from "../../../src/services/instructor.service";

const INITIAL_FORM = {
  title: "",
  description: "",
  categoryId: "",
  level: "BEGINNER",
  language: "fr",
  tags: "",
  isFree: false,
  baseCurrency: "CAD",
  planType: "STANDARD",
  durationMonths: "3",
  price: "49.99",
};

function FieldLabel({ children }) {
  return (
    <Text
      style={{
        marginBottom: 8,
        color: "#334155",
        fontSize: 14,
        fontWeight: "800",
      }}
    >
      {children}
    </Text>
  );
}

function Input({
  label,
  multiline = false,
  style,
  ...props
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <FieldLabel>{label}</FieldLabel>

      <TextInput
        {...props}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          {
            minHeight: multiline ? 120 : 52,
            borderWidth: 1,
            borderColor: "#cbd5e1",
            borderRadius: 16,
            backgroundColor: "#ffffff",
            paddingHorizontal: 15,
            paddingVertical: multiline ? 14 : 0,
            color: "#0f172a",
            fontSize: 15,
          },
          style,
        ]}
      />
    </View>
  );
}

function ChoiceButton({ active, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: active ? "#4f46e5" : "#cbd5e1",
        borderRadius: 14,
        backgroundColor: active
          ? "#eef2ff"
          : pressed
            ? "#f8fafc"
            : "#ffffff",
        paddingHorizontal: 10,
      })}
    >
      <Text
        style={{
          color: active ? "#4338ca" : "#475569",
          fontWeight: "900",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CreateCoursePage() {
  const { token } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const [loadingCategories, setLoadingCategories] =
    useState(true);
  const [uploadingImage, setUploadingImage] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setLoadingCategories(true);

        const data = await getCourseCategories();

        const items = Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
              ? data
              : [];

        if (active) {
          setCategories(items);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              "Impossible de charger les catégories.",
          );
        }
      } finally {
        if (active) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) =>
          String(category._id || category.id) ===
          String(form.categoryId),
      ),
    [categories, form.categoryId],
  );

  function update(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function pickImage() {
    try {
      setError("");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission requise",
          "Autorisez l’accès aux photos pour choisir une miniature.",
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.85,
        });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        setError("L’image sélectionnée est invalide.");
        return;
      }

      setSelectedImage(asset);
      setThumbnail(null);
    } catch (pickerError) {
      setError(
        pickerError.message ||
          "Impossible de sélectionner l’image.",
      );
    }
  }

  async function uploadImage() {
    if (!selectedImage) {
      setError("Sélectionnez d’abord une image.");
      return null;
    }

    try {
      setUploadingImage(true);
      setError("");

      const uploaded = await uploadCourseThumbnail(
        token,
        selectedImage,
      );

      const normalizedThumbnail = {
        url:
          uploaded?.url ||
          uploaded?.secureUrl ||
          uploaded?.secure_url ||
          uploaded?.file?.url ||
          uploaded?.file?.secureUrl ||
          uploaded?.asset?.url,

        publicId:
          uploaded?.publicId ||
          uploaded?.public_id ||
          uploaded?.file?.publicId ||
          uploaded?.asset?.publicId,

        altText: form.title.trim() || "Miniature du cours",
      };

      if (
        !normalizedThumbnail.url ||
        !normalizedThumbnail.publicId
      ) {
        throw new Error(
          "La réponse d’upload ne contient pas url et publicId.",
        );
      }

      setThumbnail(normalizedThumbnail);
      return normalizedThumbnail;
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.message ||
          uploadError.message ||
          "Impossible d’envoyer l’image.",
      );

      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  function validate() {
    if (form.title.trim().length < 3) {
      return "Le titre doit contenir au moins 3 caractères.";
    }

    if (form.description.trim().length < 10) {
      return "La description doit contenir au moins 10 caractères.";
    }

    if (!form.categoryId) {
      return "Sélectionnez une catégorie.";
    }

    if (!selectedImage && !thumbnail) {
      return "Sélectionnez une miniature.";
    }

    if (!form.isFree) {
      const price = Number(form.price);

      if (!Number.isFinite(price) || price < 0) {
        return "Le prix est invalide.";
      }
    }

    return "";
  }

  async function submit() {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      let finalThumbnail = thumbnail;

      if (!finalThumbnail) {
        finalThumbnail = await uploadImage();
      }

      if (!finalThumbnail) {
        return;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        categoryId: form.categoryId,
        level: form.level,
        language: form.language.trim().toLowerCase(),
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),

        thumbnail: {
          url: finalThumbnail.url,
          publicId: finalThumbnail.publicId,
          altText:
            finalThumbnail.altText ||
            form.title.trim(),
        },

        pricing: {
          isFree: form.isFree,
          baseCurrency:
            form.baseCurrency.trim().toUpperCase(),
          platformCommissionRate: 20,
          accessPlans: form.isFree
            ? [
                {
                  planType: "STANDARD",
                  durationMonths: 12,
                  price: 0,
                  isActive: true,
                },
              ]
            : [
                {
                  planType: form.planType,
                  durationMonths: Number(
                    form.durationMonths,
                  ),
                  price: Number(form.price),
                  isActive: true,
                },
              ],
        },
      };

      const response = await createInstructorCourse(
        token,
        payload,
      );

      const courseId =
        response?.course?._id ||
        response?.course?.id;

      Alert.alert(
        "Cours créé",
        "Le cours a été créé en brouillon.",
        [
          {
            text: "Continuer",
            onPress: () => {
              if (courseId) {
                router.replace(
                  `/courses/manage/${courseId}`,
                );
              } else {
                router.replace(
                  "/(instructor)/courses",
                );
              }
            },
          },
        ],
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.errors?.join?.(
            " ",
          ) ||
          requestError.message ||
          "Impossible de créer le cours.",
      );
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || uploadingImage;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: 20,
        paddingTop: 54,
        paddingBottom: 80,
        backgroundColor: "#f8fafc",
      }}
    >
      <Pressable
        onPress={() => router.back()}
        disabled={busy}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          borderRadius: 14,
          backgroundColor: pressed
            ? "#c7d2fe"
            : "#e0e7ff",
          paddingHorizontal: 16,
          paddingVertical: 11,
          opacity: busy ? 0.6 : 1,
        })}
      >
        <Text
          style={{
            color: "#4338ca",
            fontWeight: "900",
          }}
        >
          Retour
        </Text>
      </Pressable>

      <Text
        style={{
          marginTop: 24,
          fontSize: 30,
          fontWeight: "900",
          color: "#0f172a",
        }}
      >
        Créer un cours
      </Text>

      <Text
        style={{
          marginTop: 8,
          color: "#64748b",
          lineHeight: 21,
        }}
      >
        Le cours sera créé en brouillon. Vous pourrez
        ensuite ajouter les modules, ressources et quiz.
      </Text>

      {error ? (
        <View
          style={{
            marginTop: 18,
            borderRadius: 16,
            backgroundColor: "#fee2e2",
            padding: 14,
          }}
        >
          <Text
            style={{
              color: "#b91c1c",
              fontWeight: "800",
              lineHeight: 20,
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          marginTop: 22,
          borderRadius: 24,
          backgroundColor: "#ffffff",
          padding: 18,
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Text
          style={{
            marginBottom: 18,
            fontSize: 20,
            fontWeight: "900",
            color: "#0f172a",
          }}
        >
          Informations générales
        </Text>

        <Input
          label="Titre"
          value={form.title}
          onChangeText={(value) =>
            update("title", value)
          }
          placeholder="Ex. Node.js moderne"
          editable={!busy}
        />

        <Input
          label="Description"
          value={form.description}
          onChangeText={(value) =>
            update("description", value)
          }
          placeholder="Présentez le contenu du cours..."
          multiline
          editable={!busy}
        />

        <Input
          label="Tags séparés par des virgules"
          value={form.tags}
          onChangeText={(value) =>
            update("tags", value)
          }
          placeholder="nodejs, javascript, backend"
          editable={!busy}
        />

        <FieldLabel>Catégorie</FieldLabel>

        {loadingCategories ? (
          <ActivityIndicator
            style={{ marginVertical: 18 }}
            color="#4f46e5"
          />
        ) : categories.length === 0 ? (
          <View
            style={{
              marginBottom: 18,
              borderRadius: 14,
              backgroundColor: "#fef3c7",
              padding: 13,
            }}
          >
            <Text
              style={{
                color: "#92400e",
                fontWeight: "800",
              }}
            >
              Aucune catégorie disponible.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 8,
              paddingBottom: 18,
            }}
          >
            {categories.map((category) => {
              const id = category._id || category.id;
              const active =
                String(form.categoryId) === String(id);

              return (
                <Pressable
                  key={String(id)}
                  onPress={() =>
                    update("categoryId", id)
                  }
                  disabled={busy}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active
                      ? "#4f46e5"
                      : "#cbd5e1",
                    backgroundColor: active
                      ? "#eef2ff"
                      : "#ffffff",
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: active
                        ? "#4338ca"
                        : "#475569",
                      fontWeight: "900",
                    }}
                  >
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {selectedCategory ? (
          <Text
            style={{
              marginTop: -8,
              marginBottom: 18,
              color: "#64748b",
              fontSize: 12,
            }}
          >
            Catégorie sélectionnée :{" "}
            {selectedCategory.name}
          </Text>
        ) : null}

        <FieldLabel>Niveau</FieldLabel>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 18,
          }}
        >
          <ChoiceButton
            label="Débutant"
            active={form.level === "BEGINNER"}
            onPress={() =>
              update("level", "BEGINNER")
            }
          />

          <ChoiceButton
            label="Intermédiaire"
            active={form.level === "INTERMEDIATE"}
            onPress={() =>
              update("level", "INTERMEDIATE")
            }
          />

          <ChoiceButton
            label="Avancé"
            active={form.level === "ADVANCED"}
            onPress={() =>
              update("level", "ADVANCED")
            }
          />
        </View>

        <Input
          label="Langue"
          value={form.language}
          onChangeText={(value) =>
            update("language", value)
          }
          placeholder="fr"
          autoCapitalize="none"
          editable={!busy}
        />
      </View>

      <View
        style={{
          marginTop: 18,
          borderRadius: 24,
          backgroundColor: "#ffffff",
          padding: 18,
          borderWidth: 1,
          borderColor: "#e2e8f0",
        }}
      >
        <Text
          style={{
            marginBottom: 14,
            fontSize: 20,
            fontWeight: "900",
            color: "#0f172a",
          }}
        >
          Miniature
        </Text>

        {selectedImage?.uri ? (
          <Image
            source={{ uri: selectedImage.uri }}
            resizeMode="cover"
            style={{
              width: "100%",
              height: 190,
              borderRadius: 18,
              backgroundColor: "#e2e8f0",
            }}
          />
        ) : (
          <View
            style={{
              height: 190,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              backgroundColor: "#e2e8f0",
            }}
          >
            <Text
              style={{
                color: "#64748b",
                fontWeight: "800",
              }}
            >
              Aucune image sélectionnée
            </Text>
          </View>
        )}

        <Pressable
          onPress={pickImage}
          disabled={busy}
          style={({ pressed }) => ({
            marginTop: 14,
            minHeight: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            backgroundColor: pressed
              ? "#c7d2fe"
              : "#e0e7ff",
            opacity: busy ? 0.6 : 1,
          })}
        >
          <Text
            style={{
              color: "#4338ca",
              fontWeight: "900",
            }}
          >
            Choisir une image
          </Text>
        </Pressable>

        {thumbnail?.url ? (
          <Text
            style={{
              marginTop: 10,
              color: "#15803d",
              fontWeight: "800",
            }}
          >
            Image envoyée sur Cloudinary.
          </Text>
        ) : null}
      </View>

      <View
        style={{
          marginTop: 18,
          borderRadius: 24,
          backgroundColor: "#ffffff",
          padding: 18,
          borderWidth: 1,
          borderColor: "#e2e8f0",
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
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: "#0f172a",
              }}
            >
              Tarification
            </Text>

            <Text
              style={{
                marginTop: 5,
                color: "#64748b",
              }}
            >
              Activez cette option pour un cours gratuit.
            </Text>
          </View>

          <Switch
            value={form.isFree}
            onValueChange={(value) =>
              update("isFree", value)
            }
            disabled={busy}
            trackColor={{
              false: "#cbd5e1",
              true: "#a5b4fc",
            }}
            thumbColor={
              form.isFree ? "#4f46e5" : "#f8fafc"
            }
          />
        </View>

        {!form.isFree ? (
          <>
            <View style={{ marginTop: 20 }}>
              <FieldLabel>Type de plan</FieldLabel>

              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <ChoiceButton
                  label="Standard"
                  active={
                    form.planType === "STANDARD"
                  }
                  onPress={() =>
                    update("planType", "STANDARD")
                  }
                />

                <ChoiceButton
                  label="Premium"
                  active={
                    form.planType === "PREMIUM"
                  }
                  onPress={() =>
                    update("planType", "PREMIUM")
                  }
                />
              </View>
            </View>

            <FieldLabel>Durée d’accès</FieldLabel>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 18,
              }}
            >
              {["1", "3", "6", "12"].map(
                (duration) => (
                  <Pressable
                    key={duration}
                    onPress={() =>
                      update(
                        "durationMonths",
                        duration,
                      )
                    }
                    style={{
                      minWidth: 68,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor:
                        form.durationMonths === duration
                          ? "#4f46e5"
                          : "#cbd5e1",
                      borderRadius: 14,
                      backgroundColor:
                        form.durationMonths === duration
                          ? "#eef2ff"
                          : "#ffffff",
                      paddingHorizontal: 12,
                      paddingVertical: 11,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          form.durationMonths === duration
                            ? "#4338ca"
                            : "#475569",
                        fontWeight: "900",
                      }}
                    >
                      {duration} mois
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            <Input
              label="Prix"
              value={form.price}
              onChangeText={(value) =>
                update("price", value)
              }
              keyboardType="decimal-pad"
              placeholder="49.99"
              editable={!busy}
            />

            <Input
              label="Devise"
              value={form.baseCurrency}
              onChangeText={(value) =>
                update("baseCurrency", value)
              }
              placeholder="CAD"
              autoCapitalize="characters"
              editable={!busy}
            />
          </>
        ) : null}
      </View>

      <Pressable
        onPress={submit}
        disabled={busy}
        style={({ pressed }) => ({
          marginTop: 22,
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
          backgroundColor: pressed
            ? "#4338ca"
            : "#4f46e5",
          opacity: busy ? 0.65 : 1,
        })}
      >
        {busy ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text
            style={{
              color: "#ffffff",
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            Créer le cours
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
