import { HelpCircle, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const initialQuiz = {
  title: "",
  description: "",
  moduleId: "",
  passingScore: 70,
  maxAttempts: 3,
  question: "",
  optionA: "",
  optionB: "",
  correct: "A",
};

export default function CourseQuizzesTab({ course, quizzes, busy, onAdd, onDelete }) {
  const [form, setForm] = useState(initialQuiz);

  const submit = async (event) => {
    event.preventDefault();
    await onAdd({
      title: form.title.trim(),
      description: form.description.trim() || null,
      moduleId: form.moduleId,
      passingScore: Number(form.passingScore),
      maxAttempts: Number(form.maxAttempts),
      questions: [
        {
          question: form.question.trim(),
          type: "SINGLE_CHOICE",
          points: 1,
          order: 1,
          options: [
            { text: form.optionA.trim(), isCorrect: form.correct === "A" },
            { text: form.optionB.trim(), isCorrect: form.correct === "B" },
          ],
        },
      ],
      isActive: true,
    });
    setForm(initialQuiz);
  };

  return (
    <div className="grid gap-7 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-2xl font-black">Créer un quiz</h2>
        <p className="mt-2 text-sm text-slate-500">Version rapide avec une première question. Vous pourrez ensuite le modifier.</p>
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-bold">Titre<input required value={form.title} onChange={(e)=>setForm((c)=>({...c,title:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
          <label className="block text-sm font-bold">Module<select required value={form.moduleId} onChange={(e)=>setForm((c)=>({...c,moduleId:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="">Sélectionner</option>{(course?.modules||[]).map((module)=><option key={module._id} value={module._id}>{module.title}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-4"><label className="text-sm font-bold">Score requis<input type="number" min="0" max="100" value={form.passingScore} onChange={(e)=>setForm((c)=>({...c,passingScore:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label><label className="text-sm font-bold">Tentatives<input type="number" min="1" value={form.maxAttempts} onChange={(e)=>setForm((c)=>({...c,maxAttempts:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label></div>
          <label className="block text-sm font-bold">Question<input required value={form.question} onChange={(e)=>setForm((c)=>({...c,question:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
          <label className="block text-sm font-bold">Option A<input required value={form.optionA} onChange={(e)=>setForm((c)=>({...c,optionA:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
          <label className="block text-sm font-bold">Option B<input required value={form.optionB} onChange={(e)=>setForm((c)=>({...c,optionB:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3" /></label>
          <label className="block text-sm font-bold">Bonne réponse<select value={form.correct} onChange={(e)=>setForm((c)=>({...c,correct:e.target.value}))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"><option value="A">Option A</option><option value="B">Option B</option></select></label>
        </div>
        <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-4 font-black text-white disabled:opacity-60">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} />} Créer le quiz</button>
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h2 className="text-2xl font-black">Quiz du cours</h2>
        <div className="mt-6 space-y-4">
          {!quizzes?.length && <div className="py-12 text-center"><HelpCircle size={45} className="mx-auto text-indigo-600" /><p className="mt-4 font-bold text-slate-500">Aucun quiz.</p></div>}
          {(quizzes||[]).map((quiz) => (
            <article key={quiz._id} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><HelpCircle size={20} /></span>
              <div className="min-w-0 flex-1"><h3 className="font-black text-slate-950">{quiz.title}</h3><p className="mt-1 text-sm text-slate-500">{quiz.questions?.length || 0} question(s) · Réussite {quiz.passingScore}%</p></div>
              <button type="button" onClick={() => window.confirm("Supprimer ce quiz ?") && onDelete(quiz._id)} className="flex size-10 items-center justify-center rounded-xl text-red-600"><Trash2 size={18} /></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
