import {
  BookOpen,
  ChevronDown,
  Clock3,
  FileText,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { useState } from "react";

function getResourceIcon(type) {
  switch (type) {
    case "VIDEO":
      return PlayCircle;

    case "QUIZ":
      return Trophy;

    case "ARTICLE":
      return FileText;

    default:
      return BookOpen;
  }
}

function CourseCurriculum({ modules = [] }) {
  const [openedModules, setOpenedModules] = useState(() =>
    modules.length > 0 ? [String(modules[0]._id)] : [],
  );

  const toggleModule = (moduleId) => {
    const normalizedId = String(moduleId);

    setOpenedModules((current) =>
      current.includes(normalizedId)
        ? current.filter((id) => id !== normalizedId)
        : [...current, normalizedId],
    );
  };

  if (!modules.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Le programme de ce cours sera bientôt disponible.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules
        .filter((module) => module.isActive !== false)
        .sort((a, b) => Number(a.order) - Number(b.order))
        .map((module, moduleIndex) => {
          const moduleId = String(module._id);
          const isOpened = openedModules.includes(moduleId);

          const resources = (module.resources || [])
            .filter(
              (resource) => resource.isActive !== false,
            )
            .sort(
              (a, b) => Number(a.order) - Number(b.order),
            );

          const totalMinutes = resources.reduce(
            (sum, resource) =>
              sum + Number(resource.durationMinutes || 0),
            0,
          );

          return (
            <article
              key={moduleId}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => toggleModule(moduleId)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-indigo-600">
                    Module {moduleIndex + 1}
                  </p>

                  <h3 className="mt-1 text-lg font-black text-slate-950">
                    {module.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {resources.length} ressource
                    {resources.length > 1 ? "s" : ""} ·{" "}
                    {totalMinutes} min
                  </p>
                </div>

                <ChevronDown
                  size={21}
                  className={`shrink-0 text-slate-500 transition ${
                    isOpened ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpened && (
                <div className="border-t border-slate-200">
                  {module.description && (
                    <p className="border-b border-slate-100 px-5 py-4 text-sm leading-6 text-slate-600">
                      {module.description}
                    </p>
                  )}

                  <div className="divide-y divide-slate-100">
                    {resources.map((resource) => {
                      const Icon = getResourceIcon(
                        resource.type,
                      );

                      return (
                        <div
                          key={resource._id}
                          className="flex items-center justify-between gap-4 px-5 py-4"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                              <Icon size={18} />
                            </span>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {resource.title}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {resource.type}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            {resource.isPreview && (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                Aperçu
                              </span>
                            )}

                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <Clock3 size={14} />
                              {resource.durationMinutes || 0} min
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        })}
    </div>
  );
}

export default CourseCurriculum;