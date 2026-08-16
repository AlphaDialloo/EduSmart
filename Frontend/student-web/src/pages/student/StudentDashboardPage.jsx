import { Award, BookOpen, Clock3, GraduationCap, LoaderCircle, PlayCircle, Quote, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { getStudentDashboard } from "../../services/progress.service";
import { getDashboardRecommendations } from "../../services/recommendation.service";
import Navbar from "../../components/layout/Navbar";
function formatLearningTime(totalSeconds) {
  const seconds = Number(totalSeconds || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${minutes}`;
}
function formatProgress(value) {
  return `${Math.round(Number(value || 0))} %`;
}
function StudentDashboardPage() {
  const {
    user,
    token
  } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const firstName = user?.firstName || user?.first_name || "Étudiant";
  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const [response, recommendationData] = await Promise.all([getStudentDashboard(token), getDashboardRecommendations(token).catch(() => ({
          recommendations: []
        }))]);
        if (active) {
          setDashboard(response);
          setRecommendations(recommendationData.recommendations || []);
        }
      } catch (requestError) {
        console.error("Erreur chargement dashboard étudiant :", requestError);
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || "Impossible de charger le dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    if (token) {
      loadDashboard();
    }
    return () => {
      active = false;
    };
  }, [token]);
  const stats = dashboard?.stats || {};
  const recentEnrollments = dashboard?.recentEnrollments || [];
  const dashboardCards = useMemo(() => [{
    label: "Cours actifs",
    value: stats.activeCourses || 0,
    icon: BookOpen
  }, {
    label: "Progression moyenne",
    value: formatProgress(stats.averageProgress),
    icon: TrendingUp
  }, {
    label: "Temps d’apprentissage",
    value: formatLearningTime(stats.totalLearningSeconds),
    icon: Clock3
  }, {
    label: "Cours terminés",
    value: stats.completedCourses || 0,
    icon: Award
  }], [stats]);
  if (loading) {
    return <main className="flex min-h-[70vh] items-center justify-center bg-[#fffbf5]">
        <div className="text-center">
          <LoaderCircle size={40} className="mx-auto animate-spin text-emerald-600" />

          <p className="mt-4 font-semibold text-slate-500">
            Chargement du dashboard...
          </p>
        </div>
      </main>;
  }
  if (error) {
    return <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
          <h1 className="text-2xl font-black text-red-900">
            Dashboard indisponible
          </h1>

          <p className="mt-3 text-red-700">
            {error}
          </p>
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

          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
            Bonjour {firstName} 👋
          </h1>

          <p className="mt-3 max-w-2xl text-slate-500">
            Continuez votre apprentissage et suivez votre
            progression depuis votre tableau de bord.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <figure className="mb-8 overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-sm sm:p-9">
          <div className="flex items-start gap-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <Quote size={24} />
            </span>
            <div>
              <blockquote className="max-w-4xl text-xl font-black leading-relaxed sm:text-2xl">
                « L’éducation est l’arme la plus puissante que l’on puisse utiliser pour changer le monde. »
              </blockquote>
              <figcaption className="mt-4 text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
                Nelson Mandela
              </figcaption>
            </div>
          </div>
        </figure>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map(card => {
          const Icon = card.icon;
          return <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Icon size={22} />
                  </span>

                  <span className="text-3xl font-black text-slate-950">
                    {card.value}
                  </span>
                </div>

                <p className="mt-5 text-sm font-bold text-slate-500">
                  {card.label}
                </p>
              </article>;
        })}
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Continuer l’apprentissage
                </h2>

                <p className="mt-2 text-slate-500">
                  Reprenez votre dernier cours là où vous
                  l’avez arrêté.
                </p>
              </div>

              <Link to="/student/courses" className="text-sm font-black text-emerald-600">
                Voir mes cours
              </Link>
            </div>

            {recentEnrollments.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <BookOpen size={42} className="mx-auto text-emerald-600" />

                <h3 className="mt-5 text-2xl font-black text-slate-950">
                  Aucun cours commencé
                </h3>

                <p className="mt-3 text-slate-500">
                  Achetez un cours puis commencez votre
                  apprentissage.
                </p>

                <Link to="/courses" className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">
                  Explorer les cours
                </Link>
              </div> : <div className="mt-6 space-y-5">
                {recentEnrollments.map(enrollment => {
              const progress = Number(enrollment.progress_percentage || 0);
              return <article key={enrollment.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                        {enrollment.status === "COMPLETED" ? "Cours terminé" : "Cours en cours"}
                      </p>

                      <h3 className="mt-2 text-2xl font-black text-slate-950">
                        {enrollment.course_title}
                      </h3>

                      <div className="mt-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-600">
                            Progression
                          </span>

                          <span className="font-black text-emerald-600">
                            {Math.round(progress)} %
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-600" style={{
                      width: `${Math.min(Math.max(progress, 0), 100)}%`
                    }} />
                        </div>
                      </div>

                      <Link to={`/student/courses/${enrollment.course_id}`} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">
                        <PlayCircle size={19} />
                        Continuer
                      </Link>
                    </article>;
            })}
              </div>}
          </div>

          <aside className="space-y-6">
            <article className="rounded-3xl bg-slate-950 p-7 text-white">
              <GraduationCap size={34} className="text-emerald-300" />

              <h2 className="mt-5 text-2xl font-black">
                Explorez de nouveaux cours
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                Développez de nouvelles compétences grâce aux
                formations disponibles sur EduSmart.
              </p>

              <Link to="/courses" className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 font-black text-slate-950">
                Explorer les cours
              </Link>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Activité cette semaine
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Temps d’apprentissage enregistré durant les
                sept derniers jours.
              </p>

              <p className="mt-5 text-3xl font-black text-emerald-600">
                {formatLearningTime(stats.weeklyLearningSeconds)}
              </p>
            </article>
          </aside>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-black text-slate-950">Recommandé pour vous</h2>
          <p className="mt-2 text-slate-500">Suggestions basées sur votre progression, vos quiz et les cours publiés.</p>
          {recommendations.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">Terminez un cours pour recevoir des recommandations.</div> : <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recommendations.map(item => {
            const courseId = item.courseId || item.course_id;
            return <article key={item.id || courseId} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <img src={item.thumbnail || "https://placehold.co/800x450/e2e8f0/475569?text=EduSmart"} alt={item.courseTitle || "Cours recommandé"} className="h-44 w-full object-cover" />
                  <div className="p-5"><h3 className="text-xl font-black">{item.courseTitle || item.course_title || "Cours recommandé"}</h3><p className="mt-2 text-sm text-slate-500">{item.reason}</p><Link to={`/courses/${courseId}`} className="mt-5 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white">Voir le cours</Link></div>
                </article>;
          })}
            </div>}
        </section>
      </div>
    </main>;
}
export default StudentDashboardPage;
