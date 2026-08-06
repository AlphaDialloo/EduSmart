import { BookOpen } from "lucide-react";
import { Link } from "react-router";

function Footer() {
  return (
    <footer className="mt-14 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600">
              <BookOpen size={22} />
            </div>

            <span className="text-xl font-black">EduSmart</span>
          </Link>

          <p className="mt-5 max-w-md leading-7 text-slate-400">
            Une plateforme d’apprentissage moderne pour développer vos
            compétences et progresser à votre rythme.
          </p>
        </div>

        <div>
          <h3 className="font-bold">Plateforme</h3>

          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
            <Link to="/courses" className="hover:text-white">
              Explorer les cours
            </Link>

            <Link to="/login" className="hover:text-white">
              Connexion
            </Link>

            <Link to="/register" className="hover:text-white">
              Créer un compte
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Espaces</h3>

          <div className="mt-5 flex flex-col gap-3 text-sm text-slate-400">
            <Link to="/student/dashboard" className="hover:text-white">
              Étudiant
            </Link>

            <Link to="/instructor/dashboard" className="hover:text-white">
              Instructeur
            </Link>

            <Link to="/admin/dashboard" className="hover:text-white">
              Administration
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-5 py-6 text-sm text-slate-500 lg:px-8">
          © {new Date().getFullYear()} EduSmart. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

export default Footer;