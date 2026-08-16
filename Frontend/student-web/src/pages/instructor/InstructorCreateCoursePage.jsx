import { ArrowLeft, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { createInstructorCourse } from "../../services/instructor.service";
import { getPublicCourseCategories } from "../../services/courseCategory.service";
import ThumbnailUploader from "../../components/upload/ThumbnailUploader";
const initialForm = {
  title: "",
  description: "",
  categoryId: "",
  level: "BEGINNER",
  language: "fr",
  tags: "",
  thumbnail: null,
  isFree: false,
  baseCurrency: "CAD",
  planType: "STANDARD",
  durationMonths: 3,
  price: 49.99
};
function InstructorCreateCoursePage() {
  const {
    token
  } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getPublicCourseCategories().then(data => {
      if (active) setCategories(data.categories || []);
    }).catch(err => {
      if (active) setError(err.response?.data?.message || "Impossible de charger les catégories.");
    }).finally(() => {
      if (active) setLoadingCategories(false);
    });
    return () => {
      active = false;
    };
  }, []);
  const change = event => {
    const {
      name,
      value,
      type,
      checked
    } = event.target;
    setForm(current => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  const submit = async event => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        categoryId: form.categoryId.trim(),
        level: form.level,
        language: form.language.trim().toLowerCase(),
        tags: form.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        thumbnail: form.thumbnail,
        pricing: {
          isFree: form.isFree,
          baseCurrency: form.baseCurrency.trim().toUpperCase(),
          platformCommissionRate: 20,
          accessPlans: form.isFree ? [{
            planType: "STANDARD",
            durationMonths: 12,
            price: 0,
            isActive: true
          }] : [{
            planType: form.planType,
            durationMonths: Number(form.durationMonths),
            price: Number(form.price),
            isActive: true
          }]
        }
      };
      const response = await createInstructorCourse(token, payload);
      const courseId = response?.course?._id || response?.course?.id;
      navigate(courseId ? `/instructor/courses/${courseId}` : "/instructor/courses", {
        replace: true
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.errors?.join(" ") || requestError.message || "Impossible de créer le cours.");
    } finally {
      setSaving(false);
    }
  };
  return <>
      <Navbar />
      <main className="min-h-screen bg-[#fffbf5]">
        <div className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
          <Link to="/instructor/courses" className="inline-flex items-center gap-2 text-sm font-black text-emerald-600">
            <ArrowLeft size={18} /> Retour aux cours
          </Link>

          <div className="mt-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              Course Builder
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-950">
              Créer un nouveau cours
            </h1>
            <p className="mt-3 text-slate-500">
              Le cours sera créé en brouillon. Vous pourrez ensuite ajouter les
              modules, ressources, quiz et plans.
            </p>
          </div>

          {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
              {error}
            </div>}

          <form onSubmit={submit} className="mt-8 space-y-7">
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">
                Informations générales
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2 text-sm font-bold text-slate-700">
                  Titre
                  <input required name="title" value={form.title} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-emerald-500" />
                </label>

                <label className="sm:col-span-2 text-sm font-bold text-slate-700">
                  Description
                  <textarea name="description" value={form.description} onChange={change} rows={5} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-emerald-500" />
                </label>

                <label className="text-sm font-bold text-slate-700">
                  Catégorie
                  <select required name="categoryId" value={form.categoryId} onChange={change} disabled={loadingCategories} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                    <option value="">{loadingCategories ? "Chargement..." : "Sélectionner une catégorie"}</option>
                    {categories.map(category => <option key={category._id || category.id} value={category._id || category.id}>
                        {category.parentCategory?.name ? `${category.parentCategory.name} / ` : ""}{category.name}
                      </option>)}
                  </select>
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
                  Tags séparés par des virgules
                  <input name="tags" value={form.tags} onChange={change} placeholder="nodejs, javascript, backend" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
                </label>

                <label className="sm:col-span-2 text-sm font-bold text-slate-700">
                  URL de la miniature
                  <ThumbnailUploader value={form.thumbnail} onChange={thumbnail => setForm(current => ({
                  ...current,
                  thumbnail
                }))} />
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Tarification initiale
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Vous pourrez gérer plusieurs plans après la création.
                  </p>
                </div>
                <label className="flex items-center gap-3 font-bold text-slate-700">
                  <input type="checkbox" name="isFree" checked={form.isFree} onChange={change} className="size-5" />
                  Cours gratuit
                </label>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm font-bold text-slate-700">
                  Devise
                  <input name="baseCurrency" value={form.baseCurrency} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 uppercase" />
                </label>
                {!form.isFree && <>
                    <label className="text-sm font-bold text-slate-700">
                      Type
                      <select name="planType" value={form.planType} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5">
                        <option value="STANDARD">Standard</option>
                        <option value="PREMIUM">Premium</option>
                      </select>
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                      Durée
                      <select name="durationMonths" value={form.durationMonths} onChange={change} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5">
                        {[1, 3, 6, 12].map(month => <option key={month} value={month}>
                            {month} mois
                          </option>)}
                      </select>
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                      Prix
                      <input name="price" value={form.price} onChange={change} type="number" min="0" step="0.01" className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5" />
                    </label>
                  </>}
              </div>
            </section>

            <button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white disabled:opacity-60">
              {saving ? <LoaderCircle className="animate-spin" /> : <Plus />}
              {saving ? "Création..." : "Créer le cours"}
            </button>
          </form>
        </div>
      </main>
    </>;
}
export default InstructorCreateCoursePage;
