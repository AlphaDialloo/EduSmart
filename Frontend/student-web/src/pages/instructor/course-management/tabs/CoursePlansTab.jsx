import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
function newPlan() {
  return {
    planType: "STANDARD",
    durationMonths: 3,
    price: 0,
    isActive: true
  };
}
export default function CoursePlansTab({
  course,
  onSave,
  saving
}) {
  const [isFree, setIsFree] = useState(false);
  const [currency, setCurrency] = useState("CAD");
  const [commission, setCommission] = useState(20);
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    setIsFree(course?.pricing?.isFree === true);
    setCurrency(course?.pricing?.baseCurrency || "CAD");
    setCommission(Number(course?.pricing?.platformCommissionRate ?? 20));
    setPlans((course?.pricing?.accessPlans || []).map(plan => ({
      _id: plan._id,
      planType: plan.planType,
      durationMonths: Number(plan.durationMonths),
      price: Number(plan.price),
      isActive: plan.isActive !== false
    })));
  }, [course]);
  const updatePlan = (index, key, value) => {
    setPlans(current => current.map((plan, currentIndex) => currentIndex === index ? {
      ...plan,
      [key]: value
    } : plan));
  };
  const submit = () => {
    onSave({
      pricing: {
        isFree,
        baseCurrency: currency.trim().toUpperCase(),
        platformCommissionRate: Number(commission),
        accessPlans: isFree ? [{
          planType: "STANDARD",
          durationMonths: 12,
          price: 0,
          isActive: true
        }] : plans.map(plan => ({
          ...plan,
          durationMonths: Number(plan.durationMonths),
          price: Number(plan.price)
        }))
      }
    });
  };
  return <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Plans d’accès</h2>
          <p className="mt-2 text-sm text-slate-500">Configurez les offres Standard et Premium.</p>
        </div>
        <button onClick={submit} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-60">
          {saving ? <LoaderCircle size={19} className="animate-spin" /> : <Save size={19} />} Enregistrer
        </button>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-3">
        <label className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 font-bold text-slate-700">
          <input type="checkbox" checked={isFree} onChange={event => setIsFree(event.target.checked)} className="size-5" /> Cours gratuit
        </label>
        <label className="text-sm font-bold text-slate-700">Devise
          <input value={currency} onChange={event => setCurrency(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase" />
        </label>
        <label className="text-sm font-bold text-slate-700">Commission plateforme (%)
          <input type="number" min="0" max="100" value={commission} onChange={event => setCommission(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3" />
        </label>
      </div>

      {!isFree && <div className="mt-7 space-y-4">
          {plans.map((plan, index) => <div key={plan._id || index} className="grid gap-4 rounded-2xl border border-slate-200 p-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
              <label className="text-sm font-bold text-slate-700">Type
                <select value={plan.planType} onChange={event => updatePlan(index, "planType", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3">
                  <option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option>
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">Durée
                <select value={plan.durationMonths} onChange={event => updatePlan(index, "durationMonths", Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3">
                  {[1, 3, 6, 12].map(month => <option key={month} value={month}>{month} mois</option>)}
                </select>
              </label>
              <label className="text-sm font-bold text-slate-700">Prix
                <input type="number" min="0" step="0.01" value={plan.price} onChange={event => updatePlan(index, "price", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3" />
              </label>
              <label className="flex h-12 items-center gap-2 font-bold text-slate-700"><input type="checkbox" checked={plan.isActive} onChange={event => updatePlan(index, "isActive", event.target.checked)} /> Actif</label>
              <button type="button" onClick={() => setPlans(current => current.filter((_, currentIndex) => currentIndex !== index))} className="flex size-12 items-center justify-center rounded-xl border border-red-200 text-red-600"><Trash2 size={18} /></button>
            </div>)}
          <button type="button" onClick={() => setPlans(current => [...current, newPlan()])} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 px-5 py-3 font-black text-emerald-600"><Plus size={18} /> Ajouter un plan</button>
        </div>}
    </section>;
}
