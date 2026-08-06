import { BookOpen, Clock3, FileText, HelpCircle, UsersRound } from "lucide-react";

export default function CourseStatisticsTab({ course }) {
  const modules = course?.modules || [];
  const resources = modules.flatMap((module) => module.resources || []);
  const duration = resources.reduce((total, resource) => total + Number(resource.durationMinutes || 0), 0);
  const cards = [
    { label: "Modules", value: modules.length, icon: BookOpen },
    { label: "Ressources", value: resources.length, icon: FileText },
    { label: "Quiz", value: course?.quizzes?.length || 0, icon: HelpCircle },
    { label: "Durée totale", value: `${Math.floor(duration/60)} h ${duration%60} min`, icon: Clock3 },
  ];

  return (
    <div className="space-y-7">
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => { const Icon = card.icon; return <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="text-indigo-600" /><p className="mt-5 text-3xl font-black text-slate-950">{card.value}</p><p className="mt-1 text-sm font-bold text-slate-500">{card.label}</p></article>; })}
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-4"><span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><UsersRound /></span><div><h2 className="text-2xl font-black">Statistiques avancées</h2><p className="mt-1 text-sm text-slate-500">Les inscriptions, revenus et progressions détaillées seront alimentés par les services payment et progress.</p></div></div>
      </section>
    </div>
  );
}
