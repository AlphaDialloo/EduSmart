import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import CourseCard from "../../components/courses/CourseCard";
import { getCourses } from "../../services/course.service";
function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1
  });
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [level, setLevel] = useState(searchParams.get("level") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        setLoading(true);
        setError("");
        const data = await getCourses({
          page,
          limit: 12,
          search: searchParams.get("search") || undefined,
          level: searchParams.get("level") || undefined,
          category: searchParams.get("category") || undefined
        });
        if (active) {
          setCourses(data.courses || []);
          setPagination(data.pagination || {
            page: 1,
            totalPages: 1
          });
        }
      } catch (requestError) {
        console.error("Erreur de chargement du catalogue :", requestError);
        if (active) {
          setError("Impossible de charger le catalogue.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadCourses();
    return () => {
      active = false;
    };
  }, [page, searchParams]);
  function handleSubmit(event) {
    event.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    search.trim() ? nextParams.set("search", search.trim()) : nextParams.delete("search");
    level ? nextParams.set("level", level) : nextParams.delete("level");
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  }
  function changePage(nextPage) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  }
  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 lg:px-8">
      <div className="max-w-3xl">
        <p className="font-bold uppercase tracking-wider text-emerald-600">
          Catalogue EduSmart
        </p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">
          Explorer les cours
        </h1>
        <p className="mt-3 text-slate-500">
          Recherchez une formation et filtrez les résultats selon votre niveau.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un cours..." className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-emerald-500" />
        </label>

        <select value={level} onChange={event => setLevel(event.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500">
          <option value="">Tous les niveaux</option>
          <option value="BEGINNER">Débutant</option>
          <option value="INTERMEDIATE">Intermédiaire</option>
          <option value="ADVANCED">Avancé</option>
        </select>

        <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700">
          Rechercher
        </button>
      </form>

      {loading && <p className="py-16 text-center font-semibold text-slate-500">
          Chargement du catalogue...
        </p>}

      {!loading && error && <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>}

      {!loading && !error && courses.length === 0 && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Aucun cours ne correspond à votre recherche.
        </div>}

      {!loading && !error && courses.length > 0 && <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map(course => <div key={course.id} className="flex justify-center">
                <CourseCard course={course} />
              </div>)}
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-xl border border-slate-300 px-5 py-2.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
              Précédent
            </button>

            <span className="font-semibold text-slate-600">
              Page {pagination.page || page} sur {pagination.totalPages || 1}
            </span>

            <button type="button" disabled={page >= (pagination.totalPages || 1)} onClick={() => changePage(page + 1)} className="rounded-xl border border-slate-300 px-5 py-2.5 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
              Suivant
            </button>
          </div>
        </>}
    </main>;
}
export default CoursesPage;
