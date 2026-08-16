import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ThumbnailUploader from "../../components/upload/ThumbnailUploader";
import { useAuth } from "../../contexts/AuthContext";
import { createCourseCategory, deleteCourseCategory, getAdminCourseCategories, updateCourseCategory, updateCourseCategoryStatus } from "../../services/courseCategory.service";
const empty = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  image: null,
  parentCategory: "",
  order: 0,
  isActive: true
};
export default function AdminCategoriesPage() {
  const {
    token
  } = useAuth();
  const [categories, setCategories] = useState([]),
    [form, setForm] = useState(empty),
    [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const d = await getAdminCourseCategories(token);
      setCategories(d.categories || []);
    } catch (e) {
      setError(e.response?.data?.message || "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) load();
  }, [token, load]);
  const change = e => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    setForm(c => ({
      ...c,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  const reset = () => {
    setEditingId(null);
    setForm(empty);
  };
  const edit = c => {
    setEditingId(c._id || c.id);
    setForm({
      name: c.name || "",
      slug: c.slug || "",
      description: c.description || "",
      icon: c.icon || "",
      image: c.image || null,
      parentCategory: c.parentCategory?._id || "",
      order: c.order || 0,
      isActive: c.isActive !== false
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  const submit = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        parentCategory: form.parentCategory || null,
        order: Number(form.order) || 0
      };
      editingId ? await updateCourseCategory(token, editingId, payload) : await createCourseCategory(token, payload);
      reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };
  const toggle = async c => {
    try {
      await updateCourseCategoryStatus(token, c._id || c.id, c.isActive === false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Action impossible.");
    }
  };
  const remove = async c => {
    if (!window.confirm(`Supprimer ${c.name} ?`)) return;
    try {
      await deleteCourseCategory(token, c._id || c.id);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Suppression impossible.");
    }
  };
  return <main className="px-5 py-8 lg:px-8"><h1 className="text-4xl font-black">Catégories de cours</h1><p className="mt-2 text-slate-500">Création réservée aux administrateurs.</p>{error && <div className="mt-5 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}
  <form onSubmit={submit} className="mt-8 rounded-3xl border bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">{editingId ? "Modifier" : "Nouvelle catégorie"}</h2><div className="mt-5 grid gap-4 md:grid-cols-2">
  <input required name="name" value={form.name} onChange={change} placeholder="Nom" className="rounded-2xl border px-4 py-3" /><input name="slug" value={form.slug} onChange={change} placeholder="Slug automatique" className="rounded-2xl border px-4 py-3" />
  <textarea name="description" value={form.description} onChange={change} placeholder="Description" className="md:col-span-2 rounded-2xl border px-4 py-3" />
  <input name="icon" value={form.icon} onChange={change} placeholder="Icône" className="rounded-2xl border px-4 py-3" />
  <select name="parentCategory" value={form.parentCategory} onChange={change} className="rounded-2xl border px-4 py-3"><option value="">Aucune catégorie parente</option>{categories.filter(c => String(c._id || c.id) !== String(editingId || "")).map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}</select>
  <input name="order" type="number" min="0" value={form.order} onChange={change} className="rounded-2xl border px-4 py-3" /><label className="flex items-center gap-3"><input type="checkbox" name="isActive" checked={form.isActive} onChange={change} /> Active</label>
  <div className="md:col-span-2"><ThumbnailUploader value={form.image} onChange={image => setForm(c => ({
            ...c,
            image
          }))} /></div></div>
  <button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">{saving ? <LoaderCircle className="animate-spin" /> : <Plus />}{editingId ? "Enregistrer" : "Créer"}</button>{editingId && <button type="button" onClick={reset} className="ml-3 rounded-2xl bg-slate-100 px-5 py-3 font-black">Annuler</button>}</form>
  <section className="mt-8 overflow-hidden rounded-3xl border bg-white">{loading ? <div className="p-10 text-center">Chargement...</div> : <div className="overflow-x-auto"><table className="min-w-full"><thead className="bg-slate-50"><tr><th className="px-5 py-4 text-left">Nom</th><th>Parent</th><th>Cours</th><th>Statut</th><th className="text-right pr-5">Actions</th></tr></thead><tbody>{categories.map(c => <tr key={c._id || c.id} className="border-t"><td className="px-5 py-4 font-black">{c.name}</td><td className="text-center">{c.parentCategory?.name || "—"}</td><td className="text-center">{c.courseCount || 0}</td><td className="text-center"><button onClick={() => toggle(c)} className={`rounded-full px-3 py-1 text-xs font-black ${c.isActive === false ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{c.isActive === false ? "Inactive" : "Active"}</button></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => edit(c)} className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Pencil size={17} /></button><button onClick={() => remove(c)} className="rounded-xl bg-red-50 p-2 text-red-700"><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>}</section></main>;
}
