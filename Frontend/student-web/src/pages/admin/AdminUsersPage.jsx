import { LoaderCircle, Search, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getAdminUsers, updateAdminUser } from "../../services/admin.service";
const DEFAULT_PAGINATION = {
  page: 1,
  limit: 100,
  total: 0,
  totalPages: 0
};
export default function AdminUsersPage() {
  const {
    token
  } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const loadUsers = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setLoading(false);
      setError("Session administrateur introuvable. Reconnectez-vous.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await getAdminUsers(token, {
        page: 1,
        limit: 100
      });
      console.log("[AdminUsersPage] Réponse API :", data);
      const receivedUsers = Array.isArray(data?.users) ? data.users : Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
      setUsers(receivedUsers);
      setPagination({
        page: Number(data?.pagination?.page) || 1,
        limit: Number(data?.pagination?.limit) || 100,
        total: Number(data?.pagination?.total) || receivedUsers.length,
        totalPages: Number(data?.pagination?.totalPages) || (receivedUsers.length > 0 ? 1 : 0)
      });
    } catch (requestError) {
      console.error("[AdminUsersPage] Erreur :", requestError.response?.status, requestError.response?.data, requestError);
      setUsers([]);
      setError(requestError.response?.data?.message || requestError.message || "Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return users.filter(user => {
      const normalizedRole = String(user.role || "").toUpperCase();
      const matchesRole = role === "ALL" || normalizedRole === role;
      const searchableText = [user.firstName, user.lastName, user.fullName, user.email].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      return matchesRole && matchesSearch;
    });
  }, [users, search, role]);
  async function toggleUser(user) {
    const id = user.id || user._id;
    if (!id) {
      setError("L’identifiant de cet utilisateur est absent.");
      return;
    }
    try {
      setBusyId(id);
      setError("");
      await updateAdminUser(token, id, {
        isActive: user.isActive === false
      });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Impossible de modifier l’utilisateur.");
    } finally {
      setBusyId(null);
    }
  }
  async function changeRole(user, nextRole) {
    const id = user.id || user._id;
    if (!id) {
      setError("L’identifiant de cet utilisateur est absent.");
      return;
    }
    try {
      setBusyId(id);
      setError("");
      await updateAdminUser(token, id, {
        role: nextRole
      });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Impossible de modifier le rôle.");
    } finally {
      setBusyId(null);
    }
  }
  return <main className="px-5 py-8 lg:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
            Administration
          </p>

          <h1 className="mt-3 text-4xl font-black text-slate-950">
            Utilisateurs
          </h1>

          <p className="mt-2 text-slate-500">
            Gérez les étudiants, formateurs et
            administrateurs.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-5 py-3">
          <p className="text-sm font-bold text-emerald-700">
            {pagination.total} utilisateur
            {pagination.total > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
          {error}
        </div>}

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search size={18} className="text-slate-400" />

            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un utilisateur..." className="w-full bg-transparent px-3 py-3.5 text-slate-900 outline-none" />
          </div>

          <select value={role} onChange={event => setRole(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-bold text-slate-700">
            <option value="ALL">
              Tous les rôles
            </option>

            <option value="STUDENT">
              Étudiants
            </option>

            <option value="INSTRUCTOR">
              Formateurs
            </option>

            <option value="ADMIN">
              Administrateurs
            </option>

          </select>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? <div className="flex min-h-80 flex-col items-center justify-center gap-3">
            <LoaderCircle size={38} className="animate-spin text-emerald-600" />

            <p className="font-bold text-slate-500">
              Chargement des utilisateurs...
            </p>
          </div> : filteredUsers.length === 0 ? <div className="p-10 text-center">
            <p className="font-black text-slate-800">
              Aucun utilisateur trouvé
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Vérifiez les filtres ou la réponse de
              l’API.
            </p>
          </div> : <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Utilisateur
                  </th>

                  <th className="px-5 py-4">
                    Rôle
                  </th>

                  <th className="px-5 py-4">
                    Statut
                  </th>

                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map(user => {
              const id = user.id || user._id;
              const busy = busyId === id;
              const userRole = String(user.role || "STUDENT").toUpperCase();
              return <tr key={id} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-900">
                          {user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || "Sans nom"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {user.email}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <select value={userRole} disabled={busy} onChange={event => changeRole(user, event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 disabled:opacity-60">
                          <option value="STUDENT">
                            Étudiant
                          </option>

                          <option value="INSTRUCTOR">
                            Formateur
                          </option>

                          <option value="ADMIN">
                            Administrateur
                          </option>

                        </select>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${user.isActive === false ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {user.isActive === false ? "Inactif" : "Actif"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button type="button" disabled={busy} onClick={() => toggleUser(user)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60 ${user.isActive === false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {busy ? <LoaderCircle size={17} className="animate-spin" /> : user.isActive === false ? <UserCheck size={17} /> : <UserX size={17} />}

                          {user.isActive === false ? "Réactiver" : "Désactiver"}
                        </button>
                      </td>
                    </tr>;
            })}
              </tbody>
            </table>
          </div>}
      </section>
    </main>;
}
