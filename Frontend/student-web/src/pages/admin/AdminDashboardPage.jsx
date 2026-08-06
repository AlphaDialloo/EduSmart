import {
  BookOpen,
  CircleDollarSign,
  GraduationCap,
  LoaderCircle,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import { getAdminDashboard } from "../../services/admin.service";

function formatMoney(value, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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

function RevenueChart({ data = [] }) {
  const maximum = Math.max(
    ...data.map((item) =>
      Number(item.revenue ?? item.amount ?? 0),
    ),
    1,
  );

  if (!data.length) {
    return (
      <div className="mt-5 flex h-44 items-center justify-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-500">
        Aucune donnée disponible.
      </div>
    );
  }

  return (
    <div className="mt-5 flex h-52 items-end gap-2">
      {data.map((item, index) => {
        const amount = Number(
          item.revenue ?? item.amount ?? 0,
        );

        const height = Math.max(
          (amount / maximum) * 100,
          amount > 0 ? 7 : 2,
        );

        return (
          <div
            key={item.month || item.label || index}
            className="flex min-w-0 flex-1 flex-col items-center"
          >
            <div className="flex h-36 w-full items-end rounded-xl bg-slate-100 p-1">
              <div
                className="w-full rounded-lg bg-indigo-600 transition hover:bg-indigo-700"
                style={{ height: `${height}%` }}
                title={formatMoney(amount)}
              />
            </div>

            <p className="mt-2 truncate text-[11px] font-bold capitalize text-slate-500">
              {item.label || item.month}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { token } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const data = await getAdminDashboard(token, 6);

        if (active) {
          setDashboard(data);
        }
      } catch (requestError) {
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
      load();
    }

    return () => {
      active = false;
    };
  }, [token]);

  const stats = dashboard?.stats || {};

  const cards = useMemo(
    () => [
      {
        label: "Utilisateurs",
        value: stats.totalUsers || 0,
        icon: UsersRound,
      },
      {
        label: "Étudiants",
        value: stats.students || 0,
        icon: GraduationCap,
      },
      {
        label: "Formateurs",
        value: stats.instructors || 0,
        icon: ShieldCheck,
      },
      {
        label: "Cours",
        value: stats.totalCourses || 0,
        icon: BookOpen,
      },
      {
        label: "Cours publiés",
        value: stats.publishedCourses || 0,
        icon: TrendingUp,
      },
      {
        label: "Ventes",
        value: stats.totalSales || 0,
        icon: ReceiptText,
      },
      {
        label: "Revenu total",
        value: formatMoney(stats.totalRevenue),
        icon: CircleDollarSign,
      },
      {
        label: "Revenu du mois",
        value: formatMoney(stats.monthlyRevenue),
        icon: CircleDollarSign,
      },
    ],
    [stats],
  );

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <LoaderCircle
          size={42}
          className="animate-spin text-indigo-600"
        />
      </main>
    );
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-600">
          Administration
        </p>

        <h1 className="mt-2 text-4xl font-black text-slate-950">
          Tableau de bord
        </h1>

        <p className="mt-2 text-slate-500">
          Vue générale de la plateforme EduSmart.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon size={21} />
                </span>

                <span className="text-right text-2xl font-black text-slate-950">
                  {card.value}
                </span>
              </div>

              <p className="mt-4 text-sm font-bold text-slate-500">
                {card.label}
              </p>
            </article>
          );
        })}
      </section>

      <section className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Revenus mensuels
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Évolution sur les six derniers mois.
          </p>

          <RevenueChart
            data={dashboard?.monthlyRevenue || []}
          />
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Derniers paiements
          </h2>

          <div className="mt-4 space-y-2">
            {!dashboard?.recentPayments?.length ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                Aucun paiement récent.
              </div>
            ) : (
              dashboard.recentPayments
                .slice(0, 4)
                .map((payment) => (
                  <div
                    key={payment.id || payment._id}
                    className="border-b border-slate-100 py-3 last:border-0"
                  >
                    <p className="line-clamp-1 text-sm font-black text-slate-900">
                      {payment.courseTitle ||
                        payment.paymentType ||
                        "Paiement"}
                    </p>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-500">
                        {formatDate(
                          payment.paidAt ||
                            payment.createdAt,
                        )}
                      </span>

                      <span className="font-black text-emerald-600">
                        {formatMoney(
                          payment.amount,
                          payment.currency || "CAD",
                        )}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </article>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Nouveaux utilisateurs
          </h2>

          <div className="mt-4 space-y-2">
            {!dashboard?.recentUsers?.length ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Aucun utilisateur récent.
              </p>
            ) : (
              dashboard.recentUsers
                .slice(0, 5)
                .map((user) => (
                  <div
                    key={user.id || user._id}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">
                        {user.fullName ||
                          [user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          user.email}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user.email}
                      </p>
                    </div>

                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
                      {user.role}
                    </span>
                  </div>
                ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">
            Cours récents
          </h2>

          <div className="mt-4 space-y-2">
            {!dashboard?.recentCourses?.length ? (
              <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Aucun cours récent.
              </p>
            ) : (
              dashboard.recentCourses
                .slice(0, 5)
                .map((course) => (
                  <div
                    key={course.id || course._id}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">
                        {course.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(course.createdAt)}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {course.status}
                    </span>
                  </div>
                ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
