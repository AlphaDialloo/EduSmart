import { CreditCard, LoaderCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAdminPayments } from "../../services/admin.service";
function formatMoney(value, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency
  }).format(Number(value || 0));
}
function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
export default function AdminPaymentsPage() {
  const {
    token
  } = useAuth();
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getAdminPayments(token, {
          limit: 100
        });
        setPayments(data.payments || data.items || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Impossible de charger les paiements.");
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      load();
    }
  }, [token]);
  const filteredPayments = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return payments.filter(payment => {
      const matchesStatus = status === "ALL" || String(payment.status).toUpperCase() === status;
      const text = [payment.id, payment.userId, payment.courseTitle, payment.paymentType, payment.provider].filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!normalized || text.includes(normalized));
    });
  }, [payments, search, status]);
  return <main className="px-5 py-8 lg:px-8">
      <h1 className="text-4xl font-black text-slate-950">
        Paiements
      </h1>

      <p className="mt-2 text-slate-500">
        Consultez les ventes et transactions EduSmart.
      </p>

      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
          {error}
        </div>}

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search size={18} className="text-slate-400" />

            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher une transaction..." className="w-full bg-transparent px-3 py-3.5 outline-none" />
          </div>

          <select value={status} onChange={event => setStatus(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3.5 font-bold">
            <option value="ALL">Tous les statuts</option>
            <option value="SUCCEEDED">Réussis</option>
            <option value="PENDING">En attente</option>
            <option value="FAILED">Échoués</option>
            <option value="REFUNDED">Remboursés</option>
          </select>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="flex min-h-80 items-center justify-center">
            <LoaderCircle size={38} className="animate-spin text-emerald-600" />
          </div> : filteredPayments.length === 0 ? <div className="p-12 text-center">
            <CreditCard size={42} className="mx-auto text-emerald-600" />

            <p className="mt-4 font-bold text-slate-500">
              Aucun paiement trouvé.
            </p>
          </div> : <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Transaction</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Fournisseur</th>
                  <th className="px-5 py-4">Montant</th>
                  <th className="px-5 py-4">Statut</th>
                  <th className="px-5 py-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map(payment => <tr key={payment.id || payment._id} className="border-t border-slate-100">
                    <td className="px-5 py-4">
                      <p className="max-w-56 truncate font-black text-slate-900">
                        {payment.courseTitle || payment.referenceId || payment.id}
                      </p>

                      <p className="mt-1 max-w-56 truncate text-xs text-slate-500">
                        {payment.userId}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {payment.paymentType}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold text-slate-600">
                      {payment.provider}
                    </td>

                    <td className="px-5 py-4 font-black text-slate-900">
                      {formatMoney(payment.amount, payment.currency)}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        {payment.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>}
      </section>
    </main>;
}
