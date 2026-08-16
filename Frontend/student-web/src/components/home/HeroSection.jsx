import { ArrowRight, BookOpenCheck, Search, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
function HeroSection() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const handleSearch = event => {
    event.preventDefault();
    const normalizedSearch = search.trim();
    if (!normalizedSearch) {
      navigate("/courses");
      return;
    }
    navigate(`/courses?search=${encodeURIComponent(normalizedSearch)}`);
  };
  return <section className="relative overflow-hidden bg-slate-950">
      <div className="absolute -left-40 top-10 size-96 rounded-full bg-emerald-600/30 blur-3xl" />
      <div className="absolute -right-40 bottom-0 size-96 rounded-full bg-orange-400/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-18 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-200">
            <BookOpenCheck size={17} />
            Développez vos compétences
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Apprenez aujourd’hui les compétences qui construiront votre avenir.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Découvrez des formations créées par des instructeurs qualifiés,
            apprenez à votre rythme et suivez votre progression.
          </p>

          <form onSubmit={handleSearch} className="mt-9 flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center">
              <Search size={21} className="ml-3 shrink-0 text-slate-400" />

              <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Que souhaitez-vous apprendre ?" className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400" />
            </div>

            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700">
              Rechercher
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <BookOpenCheck size={19} className="text-emerald-300" />
              Parcours personnalisés
            </div>

            <div className="flex items-center gap-2">
              <Users size={19} className="text-emerald-300" />
              Suivi de progression intégré
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="rotate-2 rounded-[32px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="-rotate-2 rounded-[26px] bg-white p-6">
              <p className="text-sm font-bold text-emerald-600">
                Formation recommandée
              </p>

              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Développement Web moderne avec React
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                Maîtrisez React, créez des interfaces professionnelles et
                développez votre premier projet complet.
              </p>

              <div className="mt-7 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xl font-black text-slate-950">12 h</p>
                  <p className="mt-1 text-xs text-slate-500">Contenu</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xl font-black text-slate-950">4,8</p>
                  <p className="mt-1 text-xs text-slate-500">Évaluation</p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xl font-black text-slate-950">49,99 $</p>
                  <p className="mt-1 text-xs text-slate-500">Prix</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}
export default HeroSection;
