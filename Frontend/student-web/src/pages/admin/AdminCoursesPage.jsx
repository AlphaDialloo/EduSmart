import {
  Archive,
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminCourses,
  updateAdminCourseStatus,
} from "../../services/admin.service";

export default function AdminCoursesPage() {
  const { token } = useAuth();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminCourses(token, {
        limit: 100,
      });

      setCourses(data.courses || data.items || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Impossible de charger les cours.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      load();
    }
  }, [token]);

  const filteredCourses = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesStatus =
        status === "ALL" ||
        String(course.status).toUpperCase() === status;

      const text = [
        course.title,
        course.description,
        course.instructor?.fullName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesStatus &&
        (!normalized || text.includes(normalized))
      );
    });
  }, [courses, search, status]);

  async function changeStatus(course, nextStatus) {
    const id = course.id || course._id;

    try {
      setBusyId(id);

      await updateAdminCourseStatus(
        token,
        id,
        nextStatus,
      );

      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Impossible de modifier le cours.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="px-5 py-8 lg:px-8">
      <h1 className="text-4xl font-black text-slate-950">
        Cours
      </h1>

      <p className="mt-2 text-slate-500">
        Publiez, dépubliez et archivez les formations.
      </p>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
          {error}
        </div>
      )}

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <Search size={18} className="text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un cours..."
              className="w-full bg-transparent px-3 py-3.5 outline-none"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="rounded-2xl border border-slate-200 px-4 py-3.5 font-bold"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="DRAFT">Brouillons</option>
            <option value="PUBLISHED">Publiés</option>
            <option value="ARCHIVED">Archivés</option>
          </select>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center">
          <LoaderCircle
            size={38}
            className="animate-spin text-indigo-600"
          />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen
            size={42}
            className="mx-auto text-indigo-600"
          />

          <p className="mt-4 font-bold text-slate-500">
            Aucun cours trouvé.
          </p>
        </div>
      ) : (
        <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => {
            const id = course.id || course._id;
            const busy = busyId === id;

            return (
              <article
                key={id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <img
                  src={
                    course.thumbnail?.url ||
                    "https://placehold.co/800x450/e2e8f0/475569?text=EduSmart"
                  }
                  alt={course.title}
                  className="h-44 w-full object-cover"
                />

                <div className="p-5">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {course.status}
                  </span>

                  <h2 className="mt-3 line-clamp-2 text-xl font-black text-slate-950">
                    {course.title}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {course.instructor?.fullName ||
                      course.instructorId}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {course.status !== "PUBLISHED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          changeStatus(
                            course,
                            "PUBLISHED",
                          )
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700"
                      >
                        <CheckCircle2 size={17} />
                        Publier
                      </button>
                    )}

                    {course.status === "PUBLISHED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          changeStatus(course, "DRAFT")
                        }
                        className="flex-1 rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700"
                      >
                        Dépublier
                      </button>
                    )}

                    {course.status !== "ARCHIVED" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          changeStatus(
                            course,
                            "ARCHIVED",
                          )
                        }
                        className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-slate-700"
                      >
                        {busy ? (
                          <LoaderCircle
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Archive size={17} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
