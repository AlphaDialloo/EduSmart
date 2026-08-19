import { BookOpen, CircleDollarSign, FolderPlus, GraduationCap, LoaderCircle, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { getAdminDashboard } from "../../services/admin.service";
function formatMoney(value, currency = "CAD") {
  try {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
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
    year: "numeric"
  }).format(new Date(value));
}
function StatCard({
  icon: Icon,
  label,
  value,
  description
}) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon size={22} />
        </span>

        <span className="text-right text-3xl font-black text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-4 font-black text-slate-800">{label}</p>

      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </article>;
}
export default function AdminDashboardPage() {
  const {
    token,
    user
  } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const data = await getAdminDashboard(token, 6);
        if (active) {
          setDashboard(data);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || "Impossible de charger le tableau de bord administrateur.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    if (token) {
      loadDashboard();
    } else {
      setLoading(false);
    }
    return () => {
      active = false;
    };
  }, [token]);
  const stats = dashboard?.stats || {};
  const currency = dashboard?.recentPayments?.[0]?.currency || "CAD";
  const statCards = useMemo(() => [{
    label: "Utilisateurs",
    value: stats.totalUsers || 0,
    description: `${stats.students || 0} étudiant(s) · ${stats.instructors || 0} formateur(s)`,
    icon: UsersRound
  }, {
    label: "Cours",
    value: stats.totalCourses || 0,
    description: `${stats.publishedCourses || 0} publié(s) · ${stats.draftCourses || 0} brouillon(s)`,
    icon: BookOpen
  }, {
    label: "Ventes réussies",
    value: stats.totalSales || 0,
    description: "Paiements confirmés",
    icon: GraduationCap
  }, {
    label: "Revenu total",
    value: formatMoney(stats.totalRevenue, currency),
    description: `${formatMoney(stats.monthlyRevenue, currency)} ce mois`,
    icon: CircleDollarSign
  }], [stats, currency]);
  if (loading) {
    return <main className="flex min-h-[70vh] items-center justify-center bg-[#fffbf5]">
        <div className="text-center">
          <LoaderCircle size={42} className="mx-auto animate-spin text-emerald-600" />
          <p className="mt-4 font-bold text-slate-500">
            Chargement du dashboard administrateur...
          </p>
        </div>
      </main>;
  }
  return <main className="min-h-screen bg-[#fffbf5]">
      <section className="border-b border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-6 px-5 py-8 lg:flex-row lg:items-end lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              Administration
            </p>

            <h1 className="mt-3 text-4xl font-black text-slate-950">
              Bonjour {user?.firstName || "Administrateur"}
            </h1>

            <p className="mt-3 text-slate-500">
              Gérez les utilisateurs, les cours, les catégories et les
              paiements depuis un seul espace.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/admin/categories" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100">
              <FolderPlus size={20} />
              Créer une catégorie
            </Link>

            <Link to="/admin/courses" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
              <BookOpen size={20} />
              Gérer les cours
            </Link>
          </div>
        </div>
      </section>

      <div className="px-5 py-8 lg:px-8">
        {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
            {error}
          </div> : null}

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(card => <StatCard key={card.label} {...card} />)}
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Utilisateurs récents
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Dernières inscriptions sur EduSmart.
                </p>
              </div>

              <Link to="/admin/users" className="text-sm font-black text-emerald-600">
                Voir tous
              </Link>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {!dashboard?.recentUsers?.length ? <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                  Aucun utilisateur récent.
                </div> : dashboard.recentUsers.slice(0, 5).map(item => <div key={item.id || item._id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-900">
                        {item.fullName || [item.firstName, item.lastName].filter(Boolean).join(" ") || "Utilisateur"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.email}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {item.role}
                      </span>
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {formatDate(item.createdAt || item.created_at)}
                      </p>
                    </div>
                  </div>)}
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              Actions rapides
            </h2>

            <div className="mt-5 space-y-3">
              <Link to="/admin/categories" className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 font-black text-emerald-700 transition hover:bg-emerald-100">
                <FolderPlus size={21} />
                Gérer les catégories
              </Link>

              <Link to="/admin/users" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-black text-slate-700 transition hover:bg-slate-100">
                <UsersRound size={21} />
                Gérer les utilisateurs
              </Link>

              <Link to="/admin/courses" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-black text-slate-700 transition hover:bg-slate-100">
                <BookOpen size={21} />
                Gérer les cours
              </Link>

              <Link to="/admin/payments" className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-black text-slate-700 transition hover:bg-slate-100">
                <CircleDollarSign size={21} />
                Consulter les paiements
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>;
}
