import { Archive, BookOpen, CheckCircle2, FilePenLine, LoaderCircle, Plus, Search, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { archiveCourse, getInstructorCourses, publishCourse, unpublishCourse } from "../../services/instructor.service";
const filters = [{
  value: "ALL",
  label: "Tous"
}, {
  value: "PUBLISHED",
  label: "Publiés"
}, {
  value: "DRAFT",
  label: "Brouillons"
}, {
  value: "ARCHIVED",
  label: "Archivés"
}];
const statusLabel = s => ({
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé"
})[s] || s;
const statusClass = s => ({
  DRAFT: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-200 text-slate-700"
})[s] || "bg-slate-100 text-slate-700";
const countResources = course => (course.modules || []).reduce((total, module) => total + (module.resources?.length || 0), 0);
export default function InstructorCoursesPage() {
  const {
    token
  } = useAuth();
  const [courses, setCourses] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const r = await getInstructorCourses(token);
      setCourses(r?.courses || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    if (token) load();
  }, [token, load]);
  const visible = useMemo(() => courses.filter(c => (filter === "ALL" || c.status === filter) && (!search.trim() || `${c.title} ${c.description || ""} ${c.categoryId?.name || ""}`.toLowerCase().includes(search.trim().toLowerCase()))), [courses, filter, search]);
  const action = async (id, fn) => {
    try {
      setBusy(id);
      setError("");
      await fn();
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Action impossible.");
    } finally {
      setBusy(null);
    }
  };
  return <><Navbar /><main className="min-h-screen bg-[#fffbf5]"><section className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-10 lg:flex-row lg:items-end lg:px-8"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">Espace formateur</p><h1 className="mt-3 text-4xl font-black">Mes cours</h1><p className="mt-3 text-slate-500">Créez, modifiez et publiez vos formations.</p></div><Link to="/instructor/courses/new" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white"><Plus />Créer un cours</Link></div></section><div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">{error && <div className="mb-6 rounded-2xl bg-red-50 p-4 font-bold text-red-700">{error}</div>}<div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 lg:flex-row lg:justify-between"> <div className="flex flex-wrap gap-2">{filters.map(f => <button key={f.value} onClick={() => setFilter(f.value)} className={`rounded-xl px-4 py-2.5 text-sm font-black ${filter === f.value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{f.label}</button>)}</div><div className="flex max-w-md items-center rounded-2xl border border-slate-200 bg-slate-50 px-4"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-transparent px-3 py-3 outline-none" /></div></div>{loading ? <div className="flex min-h-96 items-center justify-center"><LoaderCircle className="animate-spin text-emerald-600" size={44} /></div> : <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visible.map(course => {
            const id = course._id || course.id;
            return <article key={id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><img src={course.thumbnail?.url || "https://placehold.co/800x450/e2e8f0/475569?text=EduSmart"} alt={course.title} className="h-48 w-full object-cover" /><div className="p-6"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(course.status)}`}>{statusLabel(course.status)}</span><h2 className="mt-4 line-clamp-2 text-xl font-black">{course.title}</h2><p className="mt-2 text-sm text-slate-500">{course.categoryId?.name || "Sans catégorie"}</p><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-50 p-3"><BookOpen className="mx-auto text-emerald-600" size={17} /><b className="mt-2 block">{course.modules?.length || 0}</b><small>Modules</small></div><div className="rounded-xl bg-slate-50 p-3"><FilePenLine className="mx-auto text-amber-600" size={17} /><b className="mt-2 block">{countResources(course)}</b><small>Ressources</small></div><div className="rounded-xl bg-slate-50 p-3"><UsersRound className="mx-auto text-emerald-600" size={17} /><b className="mt-2 block">{course.studentsCount || 0}</b><small>Étudiants</small></div></div><div className="mt-6 flex flex-wrap gap-2"><Link to={`/instructor/courses/${id}`} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white">Gérer</Link>{course.status === "DRAFT" && <button disabled={busy === id} onClick={() => action(id, () => publishCourse(token, id))} className="rounded-xl border border-emerald-200 px-4 text-sm font-black text-emerald-700"><CheckCircle2 size={17} /></button>}{course.status === "PUBLISHED" && <button disabled={busy === id} onClick={() => action(id, () => unpublishCourse(token, id))} className="rounded-xl border border-amber-200 px-3 text-sm font-black text-amber-700">Brouillon</button>}{course.status !== "ARCHIVED" && <button disabled={busy === id} onClick={() => window.confirm("Archiver ?") && action(id, () => archiveCourse(token, id))} className="flex size-11 items-center justify-center rounded-xl border border-slate-200"><Archive size={18} /></button>}</div></div></article>;
          })}</section>}</div></main></>;
}
