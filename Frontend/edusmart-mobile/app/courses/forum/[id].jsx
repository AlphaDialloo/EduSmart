import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../src/contexts/AuthContext";
import { createComment, createCoursePost, getCoursePosts, getPostComments, reactToPost } from "../../../src/services/interaction.service";
export default function CourseForumPage() {
  const {
    id
  } = useLocalSearchParams();
  const {
    token
  } = useAuth();
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  async function load() {
    try {
      setError("");
      const data = await getCoursePosts(id);
      setPosts(data.posts || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de charger le forum.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [id]);
  async function publish() {
    if (title.trim().length < 3 || content.trim().length < 3) {
      setError("Le titre et le message doivent contenir au moins 3 caractères.");
      return;
    }
    try {
      setSaving(true);
      await createCoursePost(token, {
        courseId: id,
        title,
        content
      });
      setTitle("");
      setContent("");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Publication impossible.");
    } finally {
      setSaving(false);
    }
  }
  async function like(postId) {
    await reactToPost(token, postId, "like");
    await load();
  }
  async function showComments(postId) {
    setSelectedPostId(postId);
    const data = await getPostComments(postId);
    setComments(data.comments || []);
  }
  async function sendComment() {
    if (!comment.trim() || !selectedPostId) return;
    await createComment(token, selectedPostId, comment);
    setComment("");
    await showComments(selectedPostId);
    await load();
  }
  return <View style={{
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 18,
    backgroundColor: "#fffbf5"
  }}>
      <Pressable onPress={() => router.back()}><Text style={{
        color: "#0f766e",
        fontWeight: "900"
      }}>← Retour au cours</Text></Pressable>
      <Text style={{
      marginTop: 16,
      fontSize: 29,
      fontWeight: "900",
      color: "#292524"
    }}>Forum du cours</Text>
      <View style={{
      marginTop: 16,
      borderRadius: 18,
      padding: 15,
      backgroundColor: "#fff"
    }}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Titre de la discussion" placeholderTextColor="#6b625b" style={{
        borderBottomWidth: 1,
        borderColor: "#e7e0d8",
        paddingVertical: 10,
        color: "#292524"
      }} />
        <TextInput value={content} onChangeText={setContent} placeholder="Votre question ou message..." placeholderTextColor="#6b625b" multiline style={{
        minHeight: 76,
        paddingVertical: 12,
        textAlignVertical: "top",
        color: "#292524"
      }} />
        <Pressable disabled={saving} onPress={publish} style={{
        borderRadius: 13,
        padding: 13,
        alignItems: "center",
        backgroundColor: "#0f766e"
      }}>
          <Text style={{
          color: "#fff",
          fontWeight: "900"
        }}>{saving ? "Publication..." : "Publier"}</Text>
        </Pressable>
      </View>
      {error ? <Text style={{
      marginTop: 12,
      color: "#991b1b",
      fontWeight: "800"
    }}>{error}</Text> : null}
      {loading ? <ActivityIndicator style={{
      marginTop: 30
    }} color="#0f766e" /> : <FlatList data={posts} keyExtractor={item => String(item._id || item.id)} contentContainerStyle={{
      paddingVertical: 16,
      paddingBottom: 50
    }} ListEmptyComponent={<Text style={{
      marginTop: 20,
      textAlign: "center",
      color: "#6b625b"
    }}>Soyez le premier à publier.</Text>} renderItem={({
      item
    }) => <View style={{
      marginBottom: 12,
      borderRadius: 18,
      padding: 16,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#e7e0d8"
    }}>
              <Text style={{
        fontSize: 17,
        fontWeight: "900",
        color: "#292524"
      }}>{item.title}</Text>
              <Text style={{
        marginTop: 8,
        color: "#57534e",
        lineHeight: 20
      }}>{item.content}</Text>
              <Pressable onPress={() => like(item._id || item.id)}>
                <Text style={{
          marginTop: 12,
          color: "#0f766e",
          fontWeight: "800"
        }}>👍 {item.likeCount || item.likes?.length || 0} · 💬 {item.commentsCount || 0}</Text>
              </Pressable>
              <Pressable onPress={() => showComments(item._id || item.id)}>
                <Text style={{
          marginTop: 10,
          color: "#57534e",
          fontWeight: "900"
        }}>Voir et ajouter des commentaires</Text>
              </Pressable>
              {String(selectedPostId) === String(item._id || item.id) ? <View style={{
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: "#e7e0d8"
      }}>
                  {comments.map(entry => <Text key={String(entry._id || entry.id)} style={{
          marginBottom: 8,
          color: "#57534e"
        }}>• {entry.content}</Text>)}
                  <TextInput value={comment} onChangeText={setComment} placeholder="Votre commentaire..." placeholderTextColor="#6b625b" style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#d6cec4",
          padding: 10,
          color: "#292524"
        }} />
                  <Pressable onPress={sendComment}><Text style={{
            marginTop: 10,
            color: "#0f766e",
            fontWeight: "900"
          }}>Envoyer le commentaire</Text></Pressable>
                </View> : null}
            </View>} />}
    </View>;
}
