import { ArrowLeft, BookOpen, CheckCircle2, Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
function getRedirectPath(role) {
  switch (role) {
    case "INSTRUCTOR":
      return "/instructor/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "STUDENT":
    default:
      return "/student/dashboard";
  }
}
function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    user,
    isAuthenticated
  } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    role: "STUDENT"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
  const handleRoleChange = role => {
    setForm(current => ({
      ...current,
      role
    }));
  };
  const handleSubmit = async event => {
    event.preventDefault();
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (form.password !== form.passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const response = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role
      });
      navigate(getRedirectPath(response?.user?.role || form.role), {
        replace: true
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Impossible de créer le compte.");
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
            Commencez votre parcours
          </p>

          <h1 className="mt-5 text-5xl font-black leading-tight">
            Apprenez, enseignez et développez votre avenir.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Créez votre compte étudiant pour suivre des
            formations ou devenez instructeur pour partager
            votre expertise.
          </p>

          <div className="mt-8 space-y-4">
            {["Accès à des cours modernes", "Progression synchronisée", "Plans Standard et Premium", "Espace personnalisé selon votre rôle"].map(item => <div key={item} className="flex items-center gap-3 text-slate-300">
                <CheckCircle2 size={19} className="text-emerald-400" />

                <span>{item}</span>
              </div>)}
          </div>
        </div>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} EduSmart
        </p>
      </section>

      <section className="flex items-center justify-center p-5 py-10 sm:p-10">
        <div className="w-full max-w-xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-600">
            <ArrowLeft size={17} />
            Retour à l’accueil
          </Link>

          <div className="mt-8">
            <h1 className="text-4xl font-black text-slate-950">
              Créer un compte
            </h1>

            <p className="mt-3 text-slate-500">
              Rejoignez EduSmart et commencez votre parcours.
            </p>
          </div>

          {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="text-sm font-bold text-slate-700">
                  Prénom
                </label>

                <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <UserRound size={19} className="text-slate-400" />

                  <input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required placeholder="Jordan" className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none" />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="text-sm font-bold text-slate-700">
                  Nom
                </label>

                <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <UserRound size={19} className="text-slate-400" />

                  <input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} required placeholder="Dongmeza" className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-bold text-slate-700">
                Adresse courriel
              </label>

              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                <Mail size={19} className="text-slate-400" />

                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="exemple@email.com" className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none" />
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700">
                Type de compte
              </p>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <button type="button" onClick={() => handleRoleChange("STUDENT")} className={`rounded-2xl border p-4 text-left transition ${form.role === "STUDENT" ? "border-emerald-600 bg-emerald-50 ring-4 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <GraduationCap size={22} />
                    </span>

                    <div>
                      <p className="font-black text-slate-950">
                        Étudiant
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Acheter et suivre des cours
                      </p>
                    </div>
                  </div>
                </button>

                <button type="button" onClick={() => handleRoleChange("INSTRUCTOR")} className={`rounded-2xl border p-4 text-left transition ${form.role === "INSTRUCTOR" ? "border-emerald-600 bg-emerald-50 ring-4 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <BookOpen size={22} />
                    </span>

                    <div>
                      <p className="font-black text-slate-950">
                        Instructeur
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Créer et vendre des formations
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="text-sm font-bold text-slate-700">
                  Mot de passe
                </label>

                <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <LockKeyhole size={19} className="text-slate-400" />

                  <input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} minLength={8} required placeholder="8 caractères minimum" className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none" />

                  <button type="button" onClick={() => setShowPassword(value => !value)} className="text-slate-400 hover:text-emerald-600">
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="passwordConfirmation" className="text-sm font-bold text-slate-700">
                  Confirmation
                </label>

                <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <LockKeyhole size={19} className="text-slate-400" />

                  <input id="passwordConfirmation" name="passwordConfirmation" type={showConfirmation ? "text" : "password"} value={form.passwordConfirmation} onChange={handleChange} minLength={8} required placeholder="Répétez le mot de passe" className="min-w-0 flex-1 bg-transparent px-3 py-4 outline-none" />

                  <button type="button" onClick={() => setShowConfirmation(value => !value)} className="text-slate-400 hover:text-emerald-600">
                    {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
              <input type="checkbox" required className="mt-1 size-4 rounded border-slate-300" />

              <span>
                J’accepte les conditions d’utilisation et la
                politique de confidentialité d’EduSmart.
              </span>
            </label>

            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting && <LoaderCircle size={19} className="animate-spin" />}

              {submitting ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Vous avez déjà un compte ?{" "}
            <Link to="/login" className="font-black text-emerald-600">
              Se connecter
            </Link>
          </p>
        </div>
      </section>
    </main>;
}
export default RegisterPage;
