import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Globe2, Layers3, LoaderCircle, ShoppingCart, Tag, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import CourseCurriculum from "../../components/courses/CourseCurriculum";
import PricingPlanCard from "../../components/courses/PricingPlanCard";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import courseApi, { getCourseById } from "../../services/course.service";
function CourseDetailPage() {
  const {
    courseId
  } = useParams();
  const navigate = useNavigate();
  const {
    addToCart
  } = useCart();
  const {
    token
  } = useAuth();
  const [course, setCourse] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [freeEnrollmentLoading, setFreeEnrollmentLoading] = useState(false);
  useEffect(() => {
    let active = true;
    async function loadCourse() {
      try {
        setLoading(true);
        setError("");
        const result = await getCourseById(courseId);
        if (!active) {
          return;
        }
        setCourse(result);
      } catch (requestError) {
        console.error("Erreur de chargement du cours :", requestError);
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || "Impossible de charger ce cours.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadCourse();
    return () => {
      active = false;
    };
  }, [courseId]);
  const activePlans = useMemo(() => {
    if (!course?.pricing?.accessPlans) {
      return [];
    }
    return course.pricing.accessPlans.filter(plan => plan.isActive !== false).sort((a, b) => Number(a.price) - Number(b.price));
  }, [course]);
  useEffect(() => {
    if (!activePlans.length) {
      setSelectedPlan(null);
      return;
    }
    setSelectedPlan(activePlans[0]);
  }, [activePlans]);
  const handleAddToCart = () => {
    if (!course || !selectedPlan) {
      return;
    }
    addToCart({
      courseId: course.id || course._id,
      accessPlanId: selectedPlan._id,
      title: course.title,
      description: course.description,
      image: course.image,
      imageAlt: course.imageAlt,
      instructor: course.instructor,
      category: course.category,
      planType: selectedPlan.planType,
      durationMonths: selectedPlan.durationMonths,
      price: Number(selectedPlan.price),
      currency: course.currency,
      features: selectedPlan.features
    });
    setCartMessage(`${selectedPlan.planType} ajouté au panier.`);
    window.setTimeout(() => {
      setCartMessage("");
    }, 3000);
  };
  const handleFreeEnrollment = async () => {
    if (!course?.isFree) {
      return;
    }
    if (!token) {
      setError("Connectez-vous avec un compte étudiant pour vous inscrire.");
      return;
    }
    try {
      setFreeEnrollmentLoading(true);
      setError("");
      setCartMessage("");
      const response = await courseApi.post(`/student/enrollments/${course.id || course._id}/free`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCartMessage(response.data?.message || "Inscription gratuite réussie.");
      window.setTimeout(() => {
        navigate("/student/courses");
      }, 700);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Impossible de vous inscrire gratuitement à ce cours.");
    } finally {
      setFreeEnrollmentLoading(false);
    }
  };
  if (loading) {
    return <main className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle size={38} className="mx-auto animate-spin text-emerald-600" />

          <p className="mt-4 font-semibold text-slate-500">
            Chargement du cours...
          </p>
        </div>
      </main>;
  }
  if (error || !course) {
    return <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
          <h1 className="text-2xl font-black text-red-900">
            Cours indisponible
          </h1>

          <p className="mt-3 text-red-700">
            {error || "Ce cours est introuvable."}
          </p>

          <Link to="/courses" className="mt-6 inline-flex rounded-xl bg-red-700 px-5 py-3 font-bold text-white">
            Retour aux cours
          </Link>
        </div>
      </main>;
  }
  const modules = course.modules || [];
  const resourcesCount = modules.reduce((total, module) => total + (module.resources?.length || 0), 0);
  return <main className="bg-[#fffbf5]">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white">
            <ArrowLeft size={17} />
            Retour aux cours
          </Link>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-200">
                {course.category || "Formation"}
              </span>

              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                {course.title}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                {course.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <UserRound size={18} />
                  {course.instructor}
                </span>

                <span className="flex items-center gap-2">
                  <Layers3 size={18} />
                  {modules.length} modules
                </span>

                <span className="flex items-center gap-2">
                  <BookOpen size={18} />
                  {resourcesCount} ressources
                </span>

                <span className="flex items-center gap-2">
                  <Clock3 size={18} />
                  {course.duration}
                </span>

                <span className="flex items-center gap-2">
                  <Globe2 size={18} />
                  {course.language?.toUpperCase() || "FR"}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <img src={course.image} alt={course.imageAlt || course.title} className="aspect-video w-full rounded-2xl object-cover" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_390px] lg:px-8">
        <div className="min-w-0 space-y-10">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">
              À propos de ce cours
            </h2>

            <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
              {course.description}
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Niveau
                </p>

                <p className="mt-1 font-black text-slate-900">
                  {course.levelLabel}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Durée totale
                </p>

                <p className="mt-1 font-black text-slate-900">
                  {course.duration}
                </p>
              </div>
            </div>

            {course.tags?.length > 0 && <div className="mt-7">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Tag size={19} />
                  Technologies et sujets
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {course.tags.map(tag => <span key={tag} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                      {tag}
                    </span>)}
                </div>
              </div>}
          </section>

          <section>
            <div className="mb-6">
              <h2 className="text-3xl font-black text-slate-950">
                Programme du cours
              </h2>

              <p className="mt-2 text-slate-500">
                {modules.length} modules et {resourcesCount}{" "}
                ressources pédagogiques.
              </p>
            </div>

            <CourseCurriculum modules={modules} />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
            <h2 className="text-2xl font-black text-slate-950">
              Choisissez votre formule
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sélectionnez le niveau d’accompagnement qui vous
              convient.
            </p>

            {course.isFree ? <div className="mt-6 rounded-2xl bg-emerald-50 p-6">
                <CheckCircle2 size={30} className="text-emerald-600" />

                <p className="mt-3 text-2xl font-black text-emerald-900">
                  Cours gratuit
                </p>

                <button type="button" onClick={handleFreeEnrollment} disabled={freeEnrollmentLoading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {freeEnrollmentLoading ? <>
                      <LoaderCircle size={20} className="animate-spin" />
                      Inscription...
                    </> : <>
                      <CheckCircle2 size={20} />
                      S'inscrire gratuitement
                    </>}
                </button>
              </div> : <div className="mt-6 space-y-4">
                {activePlans.map(plan => <PricingPlanCard key={plan._id} plan={plan} currency={course.currency} isSelected={selectedPlan?._id === plan._id} onSelect={setSelectedPlan} />)}
              </div>}

            {!course.isFree && <button type="button" disabled={!selectedPlan} onClick={handleAddToCart} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                <ShoppingCart size={20} />
                Ajouter ce plan au panier
              </button>}

            {cartMessage && <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                {cartMessage}
              </div>}

            <div className="mt-6 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-500">
              {course.isFree ? "Accès immédiat après l’inscription." : "Paiement sécurisé. L’accès commence après la confirmation du paiement."}
            </div>
          </div>
        </aside>
      </div>
    </main>;
}
export default CourseDetailPage;
