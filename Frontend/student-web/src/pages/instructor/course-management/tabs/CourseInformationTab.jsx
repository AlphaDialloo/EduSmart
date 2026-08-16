import { LoaderCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
const emptyForm = {
  title: "",
  description: "",
  categoryId: "",
  level: "BEGINNER",
  language: "fr",
  tags: "",
  thumbnailUrl: ""
};
export default function CourseInformationTab({
  course,
  onSave,
  saving
}) {
  const [form, setForm] = useState(emptyForm);
  useEffect(() => {
    setForm({
      title: course?.title || "",
      description: course?.description || "",
      categoryId: course?.categoryId?._id || course?.categoryId || "",
      level: course?.level || "BEGINNER",
      language: course?.language || "fr",
      tags: Array.isArray(course?.tags) ? course.tags.join(", ") : "",
      thumbnailUrl: course?.thumbnail?.url || ""
    });
  }, [course]);
  const change = event => {
    const {
      name,
      value
    } = event.target;
    setForm(current => ({
      ...current,
      [name]: value
    }));
  };
  const submit = event => {
    event.preventDefault();
    onSave({
      title: form.title.trim(),
      description: form.description.trim() || null,
      categoryId: form.categoryId.trim(),
      level: form.level,
      language: form.language.trim().toLowerCase(),
      tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      thumbnail: {
        url: form.thumbnailUrl.trim() || null,
        publicId: course?.thumbnail?.publicId || null,
        altText: form.title.trim()
      }
    });
  };
  return <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Informations générales</h2>
          <p className="mt-2 text-sm text-slate-500">Titre, description, catégorie, langue et image.</p>
        </div>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-60">
          {saving ? <LoaderCircle size={19} className="animate-spin" /> : <Save size={19} />}
          Enregistrer
        </button>
      </div>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-bold text-slate-700">
          Titre
          <input required name="title" value={form.title} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
        </label>
        <label className="sm:col-span-2 text-sm font-bold text-slate-700">
          Description
          <textarea name="description" value={form.description} onChange={change} rows={7} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
        </label>
        <label className="text-sm font-bold text-slate-700">
          ID catégorie
          <input required name="categoryId" value={form.categoryId} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
        </label>
        <label className="text-sm font-bold text-slate-700">
          Niveau
          <select name="level" value={form.level} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5">
            <option value="BEGINNER">Débutant</option>
            <option value="INTERMEDIATE">Intermédiaire</option>
            <option value="ADVANCED">Avancé</option>
          </select>
        </label>
        <label className="text-sm font-bold text-slate-700">
          Langue
          <input name="language" value={form.language} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
        </label>
        <label className="text-sm font-bold text-slate-700">
          Tags
          <input name="tags" value={form.tags} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
        </label>
        <label className="sm:col-span-2 text-sm font-bold text-slate-700">
          URL miniature
          <input name="thumbnailUrl" type="url" value={form.thumbnailUrl} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
        </label>
      </div>
    </form>;
}
