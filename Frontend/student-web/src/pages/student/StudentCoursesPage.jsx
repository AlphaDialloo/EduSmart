import { BookOpen, Clock3, LoaderCircle, PlayCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import courseApi, { getCourseById } from "../../services/course.service";
import { getMyEnrollments } from "../../services/progress.service";
import Navbar from "../../components/layout/Navbar";
function formatProgress(value) {
  return Math.min(Math.max(Number(value || 0), 0), 100);
}
function StudentCoursesPage() {
  const {
    token
  } = useAuth();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        setLoading(true);
        setError("");
        const [courseEnrollmentResponse, progressResponse] = await Promise.all([courseApi.get("/student/enrollments", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }), getMyEnrollments(token).catch(() => ({
          enrollments: []
        }))]);
        const courseEnrollments = courseEnrollmentResponse?.data?.courses || [];
        const progressEnrollments = progressResponse?.enrollments || [];
        const progressByCourseId = new Map(progressEnrollments.map(enrollment => [String(enrollment.course_id), enrollment]));
        const enrichedCourses = await Promise.all(courseEnrollments.map(async enrollment => {
          const rawCourse = enrollment?.course || {};
          const courseId = rawCourse?._id || rawCourse?.id || enrollment?.courseId;
          const progressEnrollment = progressByCourseId.get(String(courseId));
          try {
            const course = await getCourseById(courseId);
            return {
              enrollmentId: enrollment.enrollmentId,
              status: progressEnrollment?.status || enrollment.status || "ACTIVE",
              progress: formatProgress(progressEnrollment?.progress_percentage || 0),
              startedAt: progressEnrollment?.started_at || enrollment.grantedAt,
              updatedAt: progressEnrollment?.updated_at || enrollment.grantedAt,
              course
            };
          } catch (courseError) {
            console.error(`Impossible de charger le cours ${courseId} :`, courseError);
            return {
              enrollmentId: enrollment.enrollmentId,
              status: progressEnrollment?.status || enrollment.status || "ACTIVE",
              progress: formatProgress(progressEnrollment?.progress_percentage || 0),
              startedAt: progressEnrollment?.started_at || enrollment.grantedAt,
              updatedAt: progressEnrollment?.updated_at || enrollment.grantedAt,
              course: {
                id: courseId,
                title: rawCourse?.title || "Cours EduSmart",
                instructor: rawCourse?.instructor?.fullName || rawCourse?.instructorName || "Instructeur EduSmart",
                image: rawCourse?.thumbnail?.url || "https://placehold.co/900x520/e2e8f0/475569?text=EduSmart",
                imageAlt: rawCourse?.thumbnail?.altText || rawCourse?.title || "Cours EduSmart",
                category: rawCourse?.categoryId?.name || rawCourse?.category?.name || "Formation",
                duration: "Durée à venir"
              }
            };
          }
        }));
        if (active) {
          setCourses(enrichedCourses);
        }
      } catch (requestError) {
        console.error("Erreur chargement des cours étudiant :", requestError);
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || "Impossible de charger vos cours.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    if (token) {
      loadCourses();
    }
    return () => {
      active = false;
    };
  }, [token]);
  const filteredCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return courses;
    }
    return courses.filter(({
      course
    }) => [course.title, course.instructor, course.category].some(value => String(value || "").toLowerCase().includes(normalizedSearch)));
  }, [courses, search]);
  if (loading) {
    return <main className="flex min-h-[70vh] items-center justify-center bg-[#fffbf5]">
        <div className="text-center">
          <LoaderCircle size={40} className="mx-auto animate-spin text-emerald-600" />

          <p className="mt-4 font-semibold text-slate-500">
            Chargement de vos cours...
          </p>
        </div>
      </main>;
  }
  if (error) {
    return <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
          <h1 className="text-2xl font-black text-red-900">
            Impossible de charger vos cours
          </h1>

          <p className="mt-3 text-red-700">{error}</p>
        </div>
      </main>;
  }
  return <main className="min-h-screen bg-[#fffbf5]">
      <Navbar />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
            Espace étudiant
          </p>

          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950">
                Mes cours
              </h1>

              <p className="mt-3 text-slate-500">
                Retrouvez toutes vos formations et poursuivez
                votre progression.
              </p>
            </div>

            <div className="flex w-full max-w-md items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100 lg:w-auto">
              <Search size={19} className="text-slate-400" />

              <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher dans mes cours..." className="min-w-0 flex-1 bg-transparent px-3 py-3.5 outline-none" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {filteredCourses.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BookOpen size={48} className="mx-auto text-emerald-600" />

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Aucun cours trouvé
            </h2>

            <p className="mt-3 text-slate-500">
              Vous n’avez encore aucun cours correspondant à
              cette recherche.
            </p>

            <Link to="/courses" className="mt-7 inline-flex rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white">
              Explorer le catalogue
            </Link>
          </div> : <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map(({
          enrollmentId,
          status,
          progress,
          course
        }) => <article key={enrollmentId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                  <Link to={`/student/courses/${course.id}`} state={{
            enrollmentId
          }}>
                    <img src={course.image} alt={course.imageAlt || course.title} className="h-52 w-full object-cover" />
                  </Link>

                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-xs font-black uppercase tracking-wide text-emerald-600">
                        {course.category || "Formation"}
                      </span>

                      <span className={`rounded-full px-3 py-1 text-xs font-black ${status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {status === "COMPLETED" ? "Terminé" : "En cours"}
                      </span>
                    </div>

                    <Link to={`/student/courses/${course.id}`} state={{
              enrollmentId
            }}>
                      <h2 className="mt-3 line-clamp-2 min-h-14 text-xl font-black text-slate-950 transition hover:text-emerald-600">
                        {course.title}
                      </h2>
                    </Link>

                    <p className="mt-2 text-sm text-slate-500">
                      Par {course.instructor}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 size={16} />
                      {course.duration}
                    </div>

                    <div className="mt-6">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-slate-600">
                          Progression
                        </span>

                        <span className="font-black text-emerald-600">
                          {Math.round(progress)} %
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-600" style={{
                  width: `${progress}%`
                }} />
                      </div>
                    </div>

                    <Link to={`/student/courses/${course.id}`} state={{
              enrollmentId
            }} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 font-black text-white transition hover:bg-emerald-700">
                      <PlayCircle size={19} />
                      {status === "COMPLETED" ? "Revoir le cours" : "Continuer"}
                    </Link>
                  </div>
                </article>)}
          </section>}
      </div>
    </main>;
}
export default StudentCoursesPage;
