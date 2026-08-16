import { ArrowLeft, BookOpen, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
function getRedirectPath(role) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "INSTRUCTOR":
      return "/instructor/dashboard";
    case "STUDENT":
      return "/student/dashboard";
    default:
      return "/";
  }
}
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    user,
    isAuthenticated
  } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  if (isAuthenticated && user) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }
  const handleChange = event => {
    const {
      name,
      value
    } = event.target;
    setForm(current => ({
      ...current,
      [name]: value
    }));
  };
  const handleSubmit = async event => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      const response = await login(form);
      const requestedPath = location.state?.from;
      navigate(requestedPath || getRedirectPath(response.user.role), {
        replace: true
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible de vous connecter.");
    } finally {
      setSubmitting(false);
    }
  };
  return <main className="grid min-h-screen bg-[#fffbf5] lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600">
            <BookOpen size={24} />
          </div>

          <div>
            <p className="text-xl font-black">
              EduSmart
            </p>

            <p className="text-xs text-slate-400">
              Apprendre autrement
            </p>
          </div>
        </Link>

        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-300">
            Votre espace d’apprentissage
          </p>

          <h1 className="mt-5 text-5xl font-black leading-tight">
            Continuez à développer vos compétences.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Retrouvez vos cours, votre progression et
            vos ressources depuis un espace sécurisé.
          </p>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} EduSmart
        </p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600">
            <ArrowLeft size={17} />
            Retour à l’accueil
          </Link>

          <div className="mt-10">
            <h1 className="text-4xl font-black text-slate-950">
              Bon retour
            </h1>

            <p className="mt-3 text-slate-500">
              Connectez-vous à votre compte EduSmart.
            </p>
          </div>

          {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-bold text-slate-700">
                Adresse courriel
              </label>

              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                <Mail size={19} className="text-slate-400" />

                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="exemple@email.com" required className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-bold text-slate-700">
                Mot de passe
              </label>

              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                <LockKeyhole size={19} className="text-slate-400" />

                <input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Votre mot de passe" required className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none" />

                <button type="button" onClick={() => setShowPassword(value => !value)} className="text-slate-400 hover:text-emerald-600" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="size-4 rounded border-slate-300" />
                Se souvenir de moi
              </label>

              <span className="font-semibold text-slate-400">
                Connexion sécurisée
              </span>
            </div>

            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting && <LoaderCircle size={19} className="animate-spin" />}

              {submitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Vous n’avez pas encore de compte ?{" "}
            <Link to="/register" className="font-black text-emerald-600">
              Créer un compte
            </Link>
          </p>
        </div>
      </section>
    </main>;
}
export default LoginPage;
