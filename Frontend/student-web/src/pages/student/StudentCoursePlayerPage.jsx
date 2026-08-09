import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  LoaderCircle,
  PlayCircle,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import {
  getStudentCourseById,
  getStudentQuiz,
  submitCourseQuiz,
} from "../../services/course.service";
import {
  addLearningTime,
  getEnrollmentProgress,
  getMyEnrollments,
  saveResourceProgress,
} from "../../services/progress.service";

function getResourceIcon(type) {
  switch (type) {
    case "VIDEO":
      return PlayCircle;

    case "ARTICLE":
      return FileText;

    case "QUIZ":
    case "EXERCISE":
      return Trophy;

    default:
      return BookOpen;
  }
}

function clampProgress(value) {
  return Math.min(Math.max(Number(value || 0), 0), 100);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ""),
  );
}

function StudentCoursePlayerPage() {
  const { courseId } = useParams();
  const { token } = useAuth();

  // ID de progression PostgreSQL uniquement.
  // L'autorisation d'accès au cours est vérifiée par course-service.
  const [enrollmentId, setEnrollmentId] = useState(null);

  const [course, setCourse] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [openedModules, setOpenedModules] = useState([]);
  const [completedResources, setCompletedResources] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const learningIntervalRef = useRef(null);

  const activeModules = useMemo(
    () =>
      (course?.modules || [])
        .filter((module) => module.isActive !== false)
        .sort((a, b) => Number(a.order || 0) - Number(b.order || 0)),
    [course],
  );

  const allResources = useMemo(
    () =>
      activeModules.flatMap((module) =>
        (module.resources || [])
          .filter((resource) => resource.isActive !== false)
          .sort(
            (a, b) =>
              Number(a.order || 0) - Number(b.order || 0),
          )
          .map((resource) => ({
            ...resource,
            moduleId: module._id,
            moduleTitle: module.title,
          })),
      ),
    [activeModules],
  );

  /*
   * Charge le cours et retrouve l'inscription de l'étudiant.
   *
   * Cela permet à la page de fonctionner même après un
   * rafraîchissement, lorsque location.state n'existe plus.
   */
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        /*
         * course-service est la source de vérité pour l'accès au cours.
         * Si getStudentCourseById réussit, l'étudiant est bien inscrit
         * (cours gratuit ou payant).
         *
         * progress-service est facultatif ici : un cours gratuit peut
         * exister dans MongoDB avant qu'une inscription de progression
         * soit créée dans PostgreSQL.
         */
        const [studentCourseResponse, enrollmentsResponse] =
          await Promise.all([
            getStudentCourseById(token, courseId),
            getMyEnrollments(token).catch(() => ({
              enrollments: [],
            })),
          ]);

        const courseResponse =
          studentCourseResponse?.course || studentCourseResponse;

        if (!active) {
          return;
        }

        const enrollments =
          enrollmentsResponse?.enrollments || [];

        const progressEnrollment = enrollments.find(
          (enrollment) =>
            String(enrollment.course_id) === String(courseId),
        );

        /*
         * progress-service utilise un identifiant PostgreSQL au format UUID.
         * L'identifiant MongoDB de CourseEnrollment (24 caractères hexadécimaux)
         * ne doit jamais être envoyé à /api/progress/enrollments/:id/progress.
         */
        if (
          progressEnrollment &&
          isUuid(progressEnrollment.id)
        ) {
          setEnrollmentId(progressEnrollment.id);

          setOverallProgress(
            clampProgress(
              progressEnrollment.progress_percentage,
            ),
          );
        } else {
          // Le cours reste accessible même si aucune progression PostgreSQL
          // valide n'existe encore.
          setEnrollmentId(null);
          setOverallProgress(
            clampProgress(
              progressEnrollment?.progress_percentage || 0,
            ),
          );
        }

        setCourse(courseResponse);

        const modules = (courseResponse?.modules || [])
          .filter((module) => module.isActive !== false)
          .sort(
            (a, b) =>
              Number(a.order || 0) -
              Number(b.order || 0),
          );

        const firstModule = modules[0];

        const firstResource = (
          firstModule?.resources || []
        )
          .filter(
            (resource) =>
              resource.isActive !== false,
          )
          .sort(
            (a, b) =>
              Number(a.order || 0) -
              Number(b.order || 0),
          )[0];

        if (firstModule?._id) {
          setOpenedModules([
            String(firstModule._id),
          ]);
        }

        if (firstResource) {
          setSelectedResource({
            ...firstResource,
            moduleId: firstModule._id,
            moduleTitle: firstModule.title,
          });
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              requestError.message ||
              "Impossible de charger le cours.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (token && courseId) {
      loadInitialData();
    }

    return () => {
      active = false;
    };
  }, [token, courseId]);

  /*
   * Recharge les ressources déjà terminées depuis PostgreSQL.
   */
  useEffect(() => {
    let active = true;

    async function loadSavedProgress() {
      if (!token || !enrollmentId) {
        return;
      }

      try {
        setLoadingProgress(true);

        const response =
          await getEnrollmentProgress(
            token,
            enrollmentId,
          );

        if (!active) {
          return;
        }

        const completedIds = (
          response?.resources || []
        )
          .filter(
            (resource) =>
              resource.completed === true,
          )
          .map((resource) =>
            String(resource.resource_id),
          );

        setCompletedResources(completedIds);

        setOverallProgress(
          clampProgress(
            response?.enrollment
              ?.progress_percentage,
          ),
        );
      } catch (requestError) {
        console.error(
          "Erreur de chargement de la progression :",
          requestError,
        );

        // Une erreur de progression ne doit pas bloquer l'ouverture du cours.
        // L'accès au contenu est déjà validé par course-service.
        if (active) {
          setCompletedResources([]);
        }
      } finally {
        if (active) {
          setLoadingProgress(false);
        }
      }
    }

    loadSavedProgress();

    return () => {
      active = false;
    };
  }, [token, enrollmentId]);

  /*
   * Enregistre 30 secondes de temps d'apprentissage toutes
   * les 30 secondes lorsque l'onglet est visible.
   */
  useEffect(() => {
    if (
      !token ||
      !enrollmentId ||
      !selectedResource ||
      selectedResource.type === "QUIZ"
    ) {
      return undefined;
    }

    learningIntervalRef.current =
      window.setInterval(async () => {
        if (
          document.visibilityState !== "visible"
        ) {
          return;
        }

        try {
          await addLearningTime(token, {
            enrollmentId,
            courseId,
            moduleId:
              selectedResource.moduleId,
            resourceId:
              selectedResource._id,
            durationSeconds: 30,
          });
        } catch (requestError) {
          console.error(
            "Erreur d’enregistrement du temps d’apprentissage :",
            requestError,
          );
        }
      }, 30000);

    return () => {
      if (learningIntervalRef.current) {
        window.clearInterval(
          learningIntervalRef.current,
        );

        learningIntervalRef.current = null;
      }
    };
  }, [
    token,
    enrollmentId,
    courseId,
    selectedResource,
  ]);

  const toggleModule = (moduleId) => {
    const normalizedId = String(moduleId);

    setOpenedModules((current) =>
      current.includes(normalizedId)
        ? current.filter(
            (id) => id !== normalizedId,
          )
        : [...current, normalizedId],
    );
  };

  const handleSelectResource = (
    resource,
    module,
  ) => {
    setSelectedResource({
      ...resource,
      moduleId: module._id,
      moduleTitle: module.title,
    });

    setError("");
  };

  const handleSelectQuiz = async (quizMeta) => {
    if (!quizMeta?._id || !token || !courseId) {
      return;
    }

    try {
      setError("");
      setQuizLoading(true);
      setQuizResult(null);
      setQuizAnswers({});

      setSelectedResource({
        _id: quizMeta._id,
        title: quizMeta.title,
        description: quizMeta.description,
        type: "QUIZ",
        moduleId: quizMeta.moduleId,
        moduleTitle: "Quiz du cours",
      });

      const response = await getStudentQuiz(
        token,
        courseId,
        quizMeta._id,
      );

      setQuiz(response?.quiz || null);
    } catch (requestError) {
      setQuiz(null);
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Impossible de charger le quiz.",
      );
    } finally {
      setQuizLoading(false);
    }
  };

  const handleQuizOptionChange = (question, optionId) => {
    const questionId = String(question.id || question._id);
    const normalizedOptionId = String(optionId);
    const isMultiple =
      String(question.type || "").toUpperCase() === "MULTIPLE_CHOICE";

    setQuizAnswers((current) => {
      const selected = Array.isArray(current[questionId])
        ? current[questionId]
        : [];

      if (!isMultiple) {
        return {
          ...current,
          [questionId]: [normalizedOptionId],
        };
      }

      return {
        ...current,
        [questionId]: selected.includes(normalizedOptionId)
          ? selected.filter((id) => id !== normalizedOptionId)
          : [...selected, normalizedOptionId],
      };
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quiz?.id || !token || !courseId) {
      return;
    }

    try {
      setQuizSubmitting(true);
      setError("");

      const answers = (quiz.questions || []).map((question) => {
        const questionId = String(question.id || question._id);

        return {
          questionId,
          selectedOptionIds: quizAnswers[questionId] || [],
        };
      });

      const response = await submitCourseQuiz(
        token,
        courseId,
        quiz.id,
        answers,
      );

      setQuizResult(response?.result || null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Impossible de soumettre le quiz.",
      );
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleCompleteResource = async () => {
    if (
      !selectedResource ||
      !enrollmentId ||
      !token
    ) {
      return;
    }

    const resourceId = String(
      selectedResource._id,
    );

    if (
      completedResources.includes(resourceId)
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await saveResourceProgress(token, {
          enrollmentId,
          moduleId:
            selectedResource.moduleId,
          resourceId,
          totalResources: allResources.length,
          progressPercentage: 100,
          completed: true,
        });

      setCompletedResources((current) => [
        ...new Set([
          ...current.map(String),
          resourceId,
        ]),
      ]);

      setOverallProgress(
        clampProgress(
          response?.progressSummary
            ?.overallProgress ??
            response?.enrollment
              ?.progress_percentage,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Impossible d’enregistrer la progression.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedResourceCompleted =
    completedResources.includes(
      String(selectedResource?._id || ""),
    );

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

            <p className="mt-4 font-semibold text-slate-500">
              Chargement du cours...
            </p>
          </div>
        </main>
      </>
    );
  }

  if (error && !course) {
    return (
      <>
        <Navbar />

        <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-16">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <h1 className="text-2xl font-black text-red-900">
              Impossible d’ouvrir le cours
            </h1>

            <p className="mt-3 text-red-700">
              {error}
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f7f8fc]">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  Lecture du cours
                </p>

                <h1 className="mt-2 text-2xl font-black text-slate-950">
                  {course.title}
                </h1>
              </div>

              <div className="min-w-64">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-bold text-slate-600">
                    Progression
                  </span>

                  <span className="font-black text-indigo-600">
                    {Math.round(
                      overallProgress,
                    )}{" "}
                    %
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{
                      width: `${overallProgress}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mx-auto max-w-7xl px-5 pt-5 lg:px-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {error}
            </div>
          </div>
        )}

        <div className="grid min-h-[calc(100vh-145px)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-black text-slate-950">
                Programme du cours
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {loadingProgress
                  ? "Chargement de la progression..."
                  : `${completedResources.length} sur ${allResources.length} ressources terminées`}
              </p>
            </div>

            <div className="max-h-[calc(100vh-230px)] overflow-y-auto">
              {activeModules.map(
                (module, moduleIndex) => {
                  const moduleId = String(
                    module._id,
                  );

                  const isOpen =
                    openedModules.includes(
                      moduleId,
                    );

                  const resources = (
                    module.resources || []
                  )
                    .filter(
                      (resource) =>
                        resource.isActive !==
                        false,
                    )
                    .sort(
                      (a, b) =>
                        Number(a.order || 0) -
                        Number(b.order || 0),
                    );

                  return (
                    <section
                      key={moduleId}
                      className="border-b border-slate-100"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleModule(moduleId)
                        }
                        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50"
                      >
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-indigo-600">
                            Module{" "}
                            {moduleIndex + 1}
                          </p>

                          <p className="mt-1 font-black text-slate-900">
                            {module.title}
                          </p>
                        </div>

                        <ChevronDown
                          size={18}
                          className={`transition ${
                            isOpen
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div>
                          {resources.map(
                            (resource) => {
                              const Icon =
                                getResourceIcon(
                                  resource.type,
                                );

                              const resourceId =
                                String(
                                  resource._id,
                                );

                              const isSelected =
                                String(
                                  selectedResource?._id ||
                                    "",
                                ) ===
                                resourceId;

                              const isCompleted =
                                completedResources.includes(
                                  resourceId,
                                );

                              return (
                                <button
                                  key={resourceId}
                                  type="button"
                                  onClick={() =>
                                    handleSelectResource(
                                      resource,
                                      module,
                                    )
                                  }
                                  className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${
                                    isSelected
                                      ? "bg-indigo-50"
                                      : "hover:bg-slate-50"
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                      isCompleted
                                        ? "bg-emerald-100 text-emerald-700"
                                        : isSelected
                                          ? "bg-indigo-100 text-indigo-700"
                                          : "bg-slate-100 text-slate-600"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2
                                        size={18}
                                      />
                                    ) : (
                                      <Icon
                                        size={18}
                                      />
                                    )}
                                  </span>

                                  <div className="min-w-0">
                                    <p
                                      className={`font-bold ${
                                        isSelected
                                          ? "text-indigo-700"
                                          : "text-slate-800"
                                      }`}
                                    >
                                      {
                                        resource.title
                                      }
                                    </p>

                                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                      <Clock3
                                        size={13}
                                      />

                                      {resource.durationMinutes ||
                                        0}{" "}
                                      min
                                    </p>
                                  </div>
                                </button>
                              );
                            },
                          )}
                        </div>
                      )}
                    </section>
                  );
                },
              )}

              {(course?.quizzes || []).length > 0 && (
                <section className="border-b border-slate-100">
                  <div className="px-5 pb-2 pt-5">
                    <p className="text-xs font-black uppercase tracking-wide text-violet-600">
                      Quiz du cours
                    </p>
                  </div>

                  {(course.quizzes || []).map((quizMeta) => {
                    const quizId = String(quizMeta._id);
                    const isSelected =
                      selectedResource?.type === "QUIZ" &&
                      String(selectedResource?._id) === quizId;

                    return (
                      <button
                        key={quizId}
                        type="button"
                        onClick={() => handleSelectQuiz(quizMeta)}
                        className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${
                          isSelected
                            ? "bg-violet-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Trophy size={18} />
                        </span>

                        <div className="min-w-0">
                          <p
                            className={`font-bold ${
                              isSelected
                                ? "text-violet-700"
                                : "text-slate-800"
                            }`}
                          >
                            {quizMeta.title}
                          </p>

                          {quizMeta.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {quizMeta.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </section>
              )}
            </div>
          </aside>

          <section className="p-5 lg:p-8">
            {selectedResource ? (
              <div className="mx-auto max-w-5xl">
                <p className="text-sm font-black uppercase tracking-wide text-indigo-600">
                  {
                    selectedResource.moduleTitle
                  }
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {selectedResource.title}
                </h2>

                {selectedResource.description && (
                  <p className="mt-3 leading-7 text-slate-500">
                    {
                      selectedResource.description
                    }
                  </p>
                )}

                <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  {selectedResource.type ===
                    "VIDEO" && (
                    <div className="flex aspect-video items-center justify-center rounded-2xl bg-slate-950 px-5 text-white">
                      <div className="text-center">
                        <PlayCircle
                          size={60}
                          className="mx-auto text-indigo-300"
                        />

                        <p className="mt-4 font-bold">
                          Vidéo :{" "}
                          {selectedResource.videoAssetId ||
                            "Aucune vidéo configurée"}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedResource.type ===
                    "ARTICLE" && (
                    <article className="prose max-w-none text-slate-700">
                      <p className="whitespace-pre-line leading-8">
                        {selectedResource.articleContent ||
                          "Le contenu de cet article sera ajouté prochainement."}
                      </p>
                    </article>
                  )}

                  {selectedResource.type ===
                    "EXERCISE" && (
                    <div className="rounded-2xl bg-amber-50 p-6 text-amber-900">
                      <Trophy size={32} />

                      <h3 className="mt-4 text-xl font-black">
                        Exercice pratique
                      </h3>

                      <p className="mt-2 leading-7">
                        Réalisez l’exercice
                        demandé, puis marquez
                        cette ressource comme
                        terminée.
                      </p>
                    </div>
                  )}

                  {selectedResource.type ===
                    "QUIZ" && (
                    <div className="rounded-2xl bg-violet-50 p-6 text-violet-950">
                      <Trophy size={32} />

                      {quizLoading ? (
                        <div className="py-10 text-center">
                          <LoaderCircle
                            size={34}
                            className="mx-auto animate-spin text-violet-600"
                          />
                          <p className="mt-3 font-bold">
                            Chargement du quiz...
                          </p>
                        </div>
                      ) : quiz ? (
                        <>
                          <h3 className="mt-4 text-2xl font-black">
                            {quiz.title}
                          </h3>

                          {quiz.description && (
                            <p className="mt-2 leading-7 text-violet-800">
                              {quiz.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-white px-3 py-1">
                              Note de passage : {quiz.passingScore ?? 70} %
                            </span>
                            {quiz.maxAttempts && (
                              <span className="rounded-full bg-white px-3 py-1">
                                Tentatives : {quiz.maxAttempts}
                              </span>
                            )}
                            {quiz.timeLimitMinutes && (
                              <span className="rounded-full bg-white px-3 py-1">
                                Temps : {quiz.timeLimitMinutes} min
                              </span>
                            )}
                          </div>

                          <div className="mt-6 space-y-5">
                            {(quiz.questions || []).map(
                              (question, questionIndex) => {
                                const questionId = String(
                                  question.id || question._id,
                                );
                                const selected =
                                  quizAnswers[questionId] || [];
                                const isMultiple =
                                  String(
                                    question.type || "",
                                  ).toUpperCase() ===
                                  "MULTIPLE_CHOICE";

                                return (
                                  <div
                                    key={questionId}
                                    className="rounded-2xl bg-white p-5 shadow-sm"
                                  >
                                    <p className="font-black text-slate-950">
                                      {questionIndex + 1}. {question.question}
                                    </p>

                                    <div className="mt-4 space-y-2">
                                      {(question.options || []).map(
                                        (option) => {
                                          const optionId = String(
                                            option.id || option._id,
                                          );
                                          const checked =
                                            selected.includes(optionId);

                                          return (
                                            <label
                                              key={optionId}
                                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-violet-300"
                                            >
                                              <input
                                                type={
                                                  isMultiple
                                                    ? "checkbox"
                                                    : "radio"
                                                }
                                                name={`question-${questionId}`}
                                                checked={checked}
                                                onChange={() =>
                                                  handleQuizOptionChange(
                                                    question,
                                                    optionId,
                                                  )
                                                }
                                                className="mt-1"
                                              />

                                              <span className="text-sm font-semibold text-slate-700">
                                                {option.text}
                                              </span>
                                            </label>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleSubmitQuiz}
                            disabled={quizSubmitting}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {quizSubmitting && (
                              <LoaderCircle
                                size={20}
                                className="animate-spin"
                              />
                            )}

                            {quizSubmitting
                              ? "Correction..."
                              : "Soumettre le quiz"}
                          </button>

                          {quizResult && (
                            <div
                              className={`mt-6 rounded-2xl p-5 ${
                                quizResult.passed
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              <p className="text-xl font-black">
                                Résultat : {quizResult.score} %
                              </p>
                              <p className="mt-2 font-bold">
                                {quizResult.passed
                                  ? "Quiz réussi."
                                  : "La note de passage n’est pas encore atteinte."}
                              </p>
                              <p className="mt-2 text-sm">
                                Bonnes réponses : {quizResult.correctAnswers} / {quizResult.totalQuestions}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="mt-4 font-bold">
                          Impossible de charger ce quiz.
                        </p>
                      )}
                    </div>
                  )}

                  {![
                    "VIDEO",
                    "ARTICLE",
                    "EXERCISE",
                    "QUIZ",
                  ].includes(
                    selectedResource.type,
                  ) && (
                    <div className="rounded-2xl bg-slate-50 p-6 text-slate-700">
                      <BookOpen size={32} />

                      <h3 className="mt-4 text-xl font-black">
                        Ressource du cours
                      </h3>

                      <p className="mt-2">
                        Consultez cette ressource,
                        puis marquez-la comme
                        terminée.
                      </p>
                    </div>
                  )}

                  {selectedResource.type !== "QUIZ" && (
                  <button
                    type="button"
                    onClick={
                      handleCompleteResource
                    }
                    disabled={
                      saving ||
                      selectedResourceCompleted
                    }
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-black text-white transition ${
                      selectedResourceCompleted
                        ? "bg-emerald-600"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {saving ? (
                      <LoaderCircle
                        size={20}
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2
                        size={20}
                      />
                    )}

                    {selectedResourceCompleted
                      ? "Ressource terminée"
                      : saving
                        ? "Enregistrement..."
                        : "Marquer comme terminé"}
                  </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center text-slate-500">
                  <BookOpen
                    size={45}
                    className="mx-auto text-indigo-600"
                  />

                  <p className="mt-4 font-semibold">
                    Sélectionnez une ressource
                    pour commencer.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

export default StudentCoursePlayerPage;