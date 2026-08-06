import { Check, Crown } from "lucide-react";

function formatPrice(price, currency) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency || "CAD",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));
}

const featureLabels = {
  courseContent: "Accès complet au contenu",
  forumAccess: "Accès au forum",
  instructorMessaging: "Messages avec l’instructeur",
  personalizedFollowUp: "Suivi personnalisé",
  assignmentCorrection: "Correction des devoirs",
  certificateAccess: "Certificat de réussite",
};

function PricingPlanCard({
  plan,
  currency,
  isSelected,
  onSelect,
}) {
  const availableFeatures = Object.entries(
    plan?.features || {},
  ).filter(([, enabled]) => enabled === true);

  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={`relative w-full rounded-2xl border p-5 text-left transition ${
        isSelected
          ? "border-indigo-600 bg-indigo-50 ring-4 ring-indigo-100"
          : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md"
      }`}
    >
      {plan.planType === "PREMIUM" && (
        <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950">
          <Crown size={13} />
          Plus complet
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black tracking-wide text-indigo-600">
            {plan.planType}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Accès pendant {plan.durationMonths} mois
          </p>
        </div>

        <p className="text-2xl font-black text-slate-950">
          {formatPrice(plan.price, currency)}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        {availableFeatures.map(([feature]) => (
          <div
            key={feature}
            className="flex items-start gap-2 text-sm text-slate-600"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={13} strokeWidth={3} />
            </span>

            <span>{featureLabels[feature] || feature}</span>
          </div>
        ))}
      </div>

      <div
        className={`mt-5 flex items-center gap-2 text-sm font-black ${
          isSelected ? "text-indigo-700" : "text-slate-500"
        }`}
      >
        <span
          className={`flex size-5 items-center justify-center rounded-full border ${
            isSelected
              ? "border-indigo-600 bg-indigo-600"
              : "border-slate-300"
          }`}
        >
          {isSelected && (
            <span className="size-2 rounded-full bg-white" />
          )}
        </span>

        {isSelected ? "Plan sélectionné" : "Choisir ce plan"}
      </div>
    </button>
  );
}

export default PricingPlanCard;