import {
  Archive,
  BadgeDollarSign,
  BookOpen,
  CircleDollarSign,
  Clock3,
  FilePenLine,
  GraduationCap,
  LoaderCircle,
  Plus,
  ReceiptText,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  getInstructorDashboard,
  getInstructorPaymentAnalytics,
} from "../../services/instructor.service";

function formatMoney(value, currency = "CAD") {
  try {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency}`;
  }
}

function formatDate(value) {
  if (!value) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusLabel(status) {
  const labels = {
    DRAFT: "Brouillon",
    PUBLISHED: "Publié",
    ARCHIVED: "Archivé",
  };

  return labels[status] || status;
}

function getStatusClasses(status) {
  const classes = {
    DRAFT: "bg-amber-100 text-amber-700",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
    ARCHIVED: "bg-slate-200 text-slate-700",
  };

  return classes[status] || "bg-slate-100 text-slate-700";
}

function RevenueChart({ values = [], currency = "CAD" }) {
  const maximum = Math.max(
    ...values.map((item) => Number(item.instructorRevenue || 0)),
    1,
  );

  if (!values.length) {
    return (
      <div className="mt-5 flex h-40 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-500">
        Aucune donnée de revenu disponible.
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex h-44 items-end gap-2 sm:gap-3">
        {values.map((item) => {
          const revenue = Number(item.instructorRevenue || 0);

          const height = Math.max(
            (revenue / maximum) * 100,
            revenue > 0 ? 6 : 2,
          );

          return (
            <div
              key={item.month}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="mb-1 min-h-4 text-center text-[10px] font-black text-slate-600">
                {revenue > 0 ? formatMoney(revenue, currency) : ""}
              </div>

              <div className="flex h-28 w-full items-end rounded-xl bg-slate-100 p-1">
                <div
                  title={`${item.sales} vente(s) — ${formatMoney(
                    revenue,
                    currency,
                  )}`}
                  className="w-full rounded-lg bg-indigo-600 transition-all duration-700 hover:bg-indigo-700"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <p className="mt-2 truncate text-[11px] font-bold capitalize text-slate-500">
                {item.label}
              </p>

              <p className="mt-0.5 text-[10px] font-black text-indigo-600">
                {item.sales} vente{item.sales > 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InstructorDashboardPage() {
  const { token, user } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [courseDashboard, paymentAnalytics] = await Promise.all([
          getInstructorDashboard(token),
          getInstructorPaymentAnalytics(token, 6),
        ]);

        if (!active) {
          return;
        }

        setDashboard(courseDashboard);
        setAnalytics(paymentAnalytics);
      } catch (requestError) {
        console.error("Erreur dashboard formateur :", requestError);

        if (active) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Impossible de charger le tableau de bord.",
          );
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
  const revenue = analytics?.summary || {};

  const currency = analytics?.recentSales?.[0]?.currency || "CAD";

  const statCards = useMemo(
    () => [
      {
        label: "Total des cours",
        value: stats.totalCourses || 0,
        icon: BookOpen,
      },
      {
        label: "Cours publiés",
        value: stats.publishedCourses || 0,
        icon: GraduationCap,
      },
      {
        label: "Étudiants",
        value: stats.totalStudents || 0,
        icon: UsersRound,
      },
      {
        label: "Inscriptions actives",
        value: stats.activeEnrollments || 0,
        icon: CircleDollarSign,
      },
    ],
    [stats],
  );

  const revenueCards = [
    {
      label: "Revenu formateur",
      value: formatMoney(revenue.instructorRevenue, currency),
      icon: BadgeDollarSign,
    },
    {
      label: "Revenu brut",
      value: formatMoney(revenue.grossRevenue, currency),
      icon: TrendingUp,
    },
    {
      label: "Commission EduSmart",
      value: formatMoney(revenue.platformCommission, currency),
      icon: CircleDollarSign,
    },
    {
      label: "Ventes ce mois",
      value: revenue.currentMonthSales || 0,
      icon: ReceiptText,
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f8fc]">
          <div className="text-center">
            <LoaderCircle
              size={42}
              className="mx-auto animate-spin text-indigo-600"
            />

            <p className="mt-4 font-bold text-slate-500">
              Chargement du dashboard...
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f7f8fc]">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-8 lg:flex-row lg:items-end lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">
                Espace formateur
              </p>

              <h1 className="mt-3 text-4xl font-black text-slate-950">
                Bonjour {user?.firstName || "Formateur"} 👋
              </h1>

              <p className="mt-3 text-slate-500">
                Gérez vos cours, vos étudiants et vos revenus.
              </p>
            </div>

            <Link
              to="/instructor/courses/new"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Plus size={20} />
              Créer un cours
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
              {error}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <Icon size={21} />
                    </span>

                    <span className="text-3xl font-black text-slate-950">
                      {stat.value}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-500">
                    {stat.label}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {revenueCards.map((stat) => {
              const Icon = stat.icon;

              return (
                <article
                  key={stat.label}
                  className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-indigo-300">
                      <Icon size={21} />
                    </span>

                    <span className="text-right text-2xl font-black">
                      {stat.value}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-bold text-slate-300">
                    {stat.label}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <FilePenLine className="text-amber-600" />

              <p className="mt-3 text-3xl font-black">
                {stats.draftCourses || 0}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                Brouillons
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <Archive className="text-slate-600" />

              <p className="mt-3 text-3xl font-black">
                {stats.archivedCourses || 0}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                Cours archivés
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <BookOpen className="text-indigo-600" />

              <p className="mt-3 text-3xl font-black">
                {stats.totalModules || 0}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                Modules
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <Clock3 className="text-emerald-600" />

              <p className="mt-3 text-3xl font-black">
                {stats.totalResources || 0}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                Ressources
              </p>
            </article>
          </section>

          <section className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Revenus mensuels
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Revenu net sur les six derniers mois.
                  </p>
                </div>

                <div className="rounded-2xl bg-indigo-50 px-4 py-2.5 text-right">
                  <p className="text-[11px] font-black uppercase tracking-wide text-indigo-600">
                    Revenu brut ce mois
                  </p>

                  <p className="mt-1 text-lg font-black text-slate-950">
                    {formatMoney(
                      revenue.currentMonthGrossRevenue,
                      currency,
                    )}
                  </p>
                </div>
              </div>

              <RevenueChart
                values={analytics?.monthlySales || []}
                currency={currency}
              />
            </article>

            <article className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-slate-950">
                  Dernières ventes
                </h2>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
                  {analytics?.recentSales?.length || 0}
                </span>
              </div>

              <div className="mt-3 space-y-1">
                {!analytics?.recentSales?.length ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                    Aucune vente enregistrée.
                  </div>
                ) : (
                  analytics.recentSales
                    .slice(0, 2)
                    .map((sale) => (
                      <div
                        key={sale.id}
                        className="border-b border-slate-100 py-3 last:border-0"
                      >
                        <p className="line-clamp-1 text-sm font-black text-slate-900">
                          {sale.courseTitle}
                        </p>

                        <div className="mt-1.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-500">
                              {formatDate(sale.paidAt)}
                            </p>

                            <p className="mt-0.5 truncate text-[11px] font-black text-indigo-600">
                              {sale.planType || "Plan de cours"}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-black text-emerald-600">
                            +
                            {formatMoney(
                              sale.instructorRevenue,
                              sale.currency,
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                )}
              </div>

              <Link
                to="/instructor/sales"
                className="mt-3 block rounded-xl bg-slate-50 px-4 py-2.5 text-center text-sm font-black text-indigo-600 transition hover:bg-indigo-50"
              >
                Voir toutes les ventes
              </Link>
            </article>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-950">
                  Mes cours récents
                </h2>

                <p className="mt-2 text-slate-500">
                  Vos dernières formations modifiées.
                </p>
              </div>

              <Link
                to="/instructor/courses"
                className="font-black text-indigo-600"
              >
                Voir tous les cours
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {!dashboard?.recentCourses?.length ? (
                <div className="p-10 text-center">
                  <BookOpen
                    size={42}
                    className="mx-auto text-indigo-600"
                  />

                  <h3 className="mt-4 text-xl font-black">
                    Aucun cours
                  </h3>

                  <p className="mt-2 text-slate-500">
                    Commencez par créer votre première formation.
                  </p>
                </div>
              ) : (
                dashboard.recentCourses.map((course) => (
                  <article
                    key={course.id}
                    className="flex flex-col gap-4 border-b border-slate-100 p-5 last:border-b-0 sm:flex-row sm:items-center"
                  >
                    <img
                      src={
                        course.thumbnail ||
                        "https://placehold.co/300x180/e2e8f0/475569?text=EduSmart"
                      }
                      alt={course.title}
                      className="h-20 w-full rounded-2xl object-cover sm:w-36"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClasses(
                            course.status,
                          )}`}
                        >
                          {getStatusLabel(course.status)}
                        </span>

                        <span className="text-xs font-bold text-slate-500">
                          {course.category}
                        </span>
                      </div>

                      <h3 className="mt-2 text-lg font-black text-slate-950">
                        {course.title}
                      </h3>

                      <p className="mt-1.5 text-sm text-slate-500">
                        {course.studentsCount} étudiant
                        {course.studentsCount > 1 ? "s" : ""} ·{" "}
                        {course.modulesCount} module
                        {course.modulesCount > 1 ? "s" : ""}
                      </p>
                    </div>

                    <Link
                      to={`/instructor/courses/${course.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-indigo-600 hover:text-indigo-600"
                    >
                      Gérer
                    </Link>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default InstructorDashboardPage;