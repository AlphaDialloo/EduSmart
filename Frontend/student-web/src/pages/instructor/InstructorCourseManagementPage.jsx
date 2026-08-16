import { Archive, ArrowLeft, BookOpen, HelpCircle, Info, LoaderCircle, Settings2, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { addCourseModule, addCourseQuiz, addCourseResource, archiveCourse, deleteCourseModule, deleteCourseQuiz, deleteCourseResource, getCourseQuizzes, getInstructorCourseById, publishCourse, unpublishCourse, updateCourseModule, updateInstructorCourse } from "../../services/instructor.service";
import CourseInformationTab from "./course-management/tabs/CourseInformationTab";
import CourseModulesTab from "./course-management/tabs/CourseModulesTab";
import CoursePlansTab from "./course-management/tabs/CoursePlansTab";
import CourseQuizzesTab from "./course-management/tabs/CourseQuizzesTab";
import CourseStatisticsTab from "./course-management/tabs/CourseStatisticsTab";
const tabs = [{
  id: "information",
  label: "Informations",
  icon: Info
}, {
  id: "plans",
  label: "Plans",
  icon: Settings2
}, {
  id: "modules",
  label: "Modules & ressources",
  icon: BookOpen
}, {
  id: "quizzes",
  label: "Quiz",
  icon: HelpCircle
}, {
  id: "statistics",
  label: "Statistiques",
  icon: TrendingUp
}];
function statusLabel(status) {
  return {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    ARCHIVED: "Archivé"
  }[status] || status;
}
function InstructorCourseManagementPage() {
  const {
    courseId
  } = useParams();
  const {
    token
  } = useAuth();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState("information");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [courseResponse, quizResponse] = await Promise.all([getInstructorCourseById(token, courseId), getCourseQuizzes(token, courseId)]);
      setCourse(courseResponse?.course || courseResponse);
      setQuizzes(quizResponse?.quizzes || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Impossible de charger le cours.");
    } finally {
      setLoading(false);
    }
  }, [token, courseId]);
  useEffect(() => {
    if (token && courseId) load();
  }, [token, courseId, load]);
  const action = async (fn, successMessage) => {
    try {
      setBusy(true);
      setError("");
      setMessage("");
      await fn();
      setMessage(successMessage);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.response?.data?.errors?.join(" ") || requestError.message || "Action impossible.");
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <><Navbar /><main className="flex min-h-[70vh] items-center justify-center bg-[#fffbf5]"><LoaderCircle size={44} className="animate-spin text-emerald-600" /></main></>;
  if (!course) return <><Navbar /><main className="mx-auto max-w-4xl p-10"><div className="rounded-3xl bg-red-50 p-8 text-red-700">{error || "Cours introuvable."}</div></main></>;
  return <>
      <Navbar />
      <main className="min-h-screen bg-[#fffbf5]">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
            <Link to="/instructor/courses" className="inline-flex items-center gap-2 text-sm font-black text-emerald-600"><ArrowLeft size={17} /> Mes cours</Link>
            <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-5">
                <img src={course.thumbnail?.url || "https://placehold.co/300x180/e2e8f0/475569?text=EduSmart"} alt={course.title} className="h-24 w-40 rounded-2xl object-cover" />
                <div className="min-w-0"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-600">{statusLabel(course.status)}</span><h1 className="mt-3 truncate text-3xl font-black text-slate-950">{course.title}</h1><p className="mt-1 text-sm text-slate-500">{course.modules?.length || 0} module(s) · {quizzes.length} quiz</p></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {course.status !== "PUBLISHED" && course.status !== "ARCHIVED" && <button disabled={busy} onClick={() => action(() => publishCourse(token, courseId), "Cours publié.")} className="rounded-xl bg-emerald-600 px-5 py-3 font-black text-white">Publier</button>}
                {course.status === "PUBLISHED" && <button disabled={busy} onClick={() => action(() => unpublishCourse(token, courseId), "Cours remis en brouillon.")} className="rounded-xl border border-amber-200 px-5 py-3 font-black text-amber-700">Brouillon</button>}
                {course.status !== "ARCHIVED" && <button disabled={busy} onClick={() => window.confirm("Archiver ce cours ?") && action(() => archiveCourse(token, courseId), "Cours archivé.")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-black text-slate-700"><Archive size={18} /> Archiver</button>}
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{error}</div>}
          {message && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">{message}</div>}

          <nav className="mb-7 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2">
            {tabs.map(tab => {
            const Icon = tab.icon;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${activeTab === tab.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}><Icon size={17} />{tab.label}</button>;
          })}
          </nav>

          {activeTab === "information" && <CourseInformationTab course={course} saving={busy} onSave={payload => action(() => updateInstructorCourse(token, courseId, payload), "Informations enregistrées.")} />}
          {activeTab === "plans" && <CoursePlansTab course={course} saving={busy} onSave={payload => action(() => updateInstructorCourse(token, courseId, payload), "Plans enregistrés.")} />}
          {activeTab === "modules" && <CourseModulesTab course={course} busy={busy} onAddModule={payload => action(() => addCourseModule(token, courseId, payload), "Module ajouté.")} onUpdateModule={(moduleId, payload) => action(() => updateCourseModule(token, courseId, moduleId, payload), "Module modifié.")} onDeleteModule={moduleId => action(() => deleteCourseModule(token, courseId, moduleId), "Module supprimé.")} onAddResource={(moduleId, payload) => action(() => addCourseResource(token, courseId, moduleId, payload), "Ressource ajoutée.")} onDeleteResource={(moduleId, resourceId) => action(() => deleteCourseResource(token, courseId, moduleId, resourceId), "Ressource supprimée.")} />}
          {activeTab === "quizzes" && <CourseQuizzesTab course={course} quizzes={quizzes} busy={busy} onAdd={payload => action(() => addCourseQuiz(token, courseId, payload), "Quiz créé.")} onDelete={quizId => action(() => deleteCourseQuiz(token, courseId, quizId), "Quiz supprimé.")} />}
          {activeTab === "statistics" && <CourseStatisticsTab course={{
          ...course,
          quizzes
        }} />}
        </div>
      </main>
    </>;
}
export default InstructorCourseManagementPage;
