import { ArrowLeft, CheckCircle2, CreditCard, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import Navbar from "../../components/layout/Navbar";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { createPayment, simulatePaymentSuccess } from "../../services/payment.service";
function formatPrice(value, currency = "CAD") {
  const numericValue = Number(value || 0);
  try {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(numericValue);
  } catch {
    return `${numericValue.toFixed(2)} ${currency}`;
  }
}
function createIdempotencyKey(item, userId) {
  const courseId = item.courseId;
  const planId = item.accessPlanId;
  return ["course", userId || "student", courseId, planId, Date.now()].join("-");
}
function CheckoutPage() {
  const navigate = useNavigate();
  const {
    token,
    user,
    isAuthenticated
  } = useAuth();
  const {
    items,
    total,
    itemCount,
    clearCart
  } = useCart();
  const [billing, setBilling] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    address: "",
    city: "",
    province: "Québec",
    country: "Canada",
    postalCode: ""
  });
  const [paymentMethod, setPaymentMethod] = useState("TEST");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const currency = items[0]?.currency || "CAD";
  const estimatedTps = Number(total || 0) * 0.05;
  const estimatedTvq = Number(total || 0) * 0.09975;
  const estimatedTotal = Number(total || 0) + estimatedTps + estimatedTvq;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{
      from: "/checkout"
    }} />;
  }
  if (itemCount === 0) {
    return <Navigate to="/cart" replace />;
  }
  const handleBillingChange = event => {
    const {
      name,
      value
    } = event.target;
    setBilling(current => ({
      ...current,
      [name]: value
    }));
  };
  const validateCheckout = () => {
    if (!token) {
      return "Vous devez être connecté.";
    }
    if (!items.length) {
      return "Votre panier est vide.";
    }
    const requiredFields = ["firstName", "lastName", "email", "address", "city", "province", "country", "postalCode"];
    const missingField = requiredFields.find(field => !String(billing[field] || "").trim());
    if (missingField) {
      return "Veuillez remplir toutes les informations de facturation.";
    }
    const invalidItem = items.find(item => !item.courseId || !item.accessPlanId);
    if (invalidItem) {
      return "Un cours du panier ne contient pas de plan valide.";
    }
    return null;
  };
  const handleCheckout = async () => {
    const validationError = validateCheckout();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setProcessing(true);
      setError("");
      setSuccessMessage("");
      for (const item of items) {
        const creationResult = await createPayment(token, {
          paymentType: "COURSE_PURCHASE",
          provider: paymentMethod,
          referenceId: item.courseId,
          accessPlanId: item.accessPlanId,
          idempotencyKey: createIdempotencyKey(item, user?.id)
        });
        const paymentId = creationResult?.payment?.id;
        if (!paymentId) {
          throw new Error(`Le paiement du cours « ${item.title} » n’a pas été créé correctement.`);
        }
        await simulatePaymentSuccess(token, paymentId);
      }
      setSuccessMessage("Paiement confirmé. Vos cours sont maintenant accessibles.");
      clearCart();
      window.setTimeout(() => {
        navigate("/student/courses", {
          replace: true
        });
      }, 1200);
    } catch (requestError) {
      console.error("Erreur pendant le paiement :", requestError);
      setError(requestError.response?.data?.message || requestError.message || "Le paiement n’a pas pu être traité.");
    } finally {
      setProcessing(false);
    }
  };
  return <>
      <Navbar />

      <main className="min-h-screen bg-[#fffbf5]">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <Link to="/cart" className="inline-flex items-center gap-2 text-sm font-black text-emerald-600 transition hover:text-emerald-700">
            <ArrowLeft size={18} />
            Retour au panier
          </Link>

          <div className="mt-6">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
              Paiement sécurisé
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
              Finaliser la commande
            </h1>

            <p className="mt-3 text-slate-500">
              Vérifiez vos informations et confirmez
              l’achat de vos formations.
            </p>
          </div>

          {error && <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {error}
            </div>}

          {successMessage && <div className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
              <CheckCircle2 size={20} />
              {successMessage}
            </div>}

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]">
            <section className="space-y-8">
              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <LockKeyhole size={22} />
                  </span>

                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      Informations de facturation
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Ces informations seront associées à
                      votre transaction.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="text-sm font-bold text-slate-700">
                      Prénom
                    </label>

                    <input id="firstName" name="firstName" value={billing.firstName} onChange={handleBillingChange} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="text-sm font-bold text-slate-700">
                      Nom
                    </label>

                    <input id="lastName" name="lastName" value={billing.lastName} onChange={handleBillingChange} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="text-sm font-bold text-slate-700">
                      Adresse courriel
                    </label>

                    <input id="email" name="email" type="email" value={billing.email} onChange={handleBillingChange} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="text-sm font-bold text-slate-700">
                      Adresse
                    </label>

                    <input id="address" name="address" value={billing.address} onChange={handleBillingChange} placeholder="123, rue Principale" required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>

                  <div>
                    <label htmlFor="city" className="text-sm font-bold text-slate-700">
                      Ville
                    </label>

                    <input id="city" name="city" value={billing.city} onChange={handleBillingChange} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>

                  <div>
                    <label htmlFor="province" className="text-sm font-bold text-slate-700">
                      Province
                    </label>

                    <input id="province" name="province" value={billing.province} onChange={handleBillingChange} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>

                  <div>
                    <label htmlFor="country" className="text-sm font-bold text-slate-700">
                      Pays
                    </label>

                    <input id="country" name="country" value={billing.country} onChange={handleBillingChange} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>

                  <div>
                    <label htmlFor="postalCode" className="text-sm font-bold text-slate-700">
                      Code postal
                    </label>

                    <input id="postalCode" name="postalCode" value={billing.postalCode} onChange={handleBillingChange} required className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 uppercase outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <CreditCard size={22} />
                  </span>

                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      Mode de paiement
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Le fournisseur TEST est utilisé pour
                      valider la V1.
                    </p>
                  </div>
                </div>

                <label className={`mt-7 flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${paymentMethod === "TEST" ? "border-emerald-600 bg-emerald-50 ring-4 ring-emerald-100" : "border-slate-200"}`}>
                  <input type="radio" name="paymentMethod" value="TEST" checked={paymentMethod === "TEST"} onChange={() => setPaymentMethod("TEST")} className="size-4" />

                  <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <CreditCard size={20} />
                  </span>

                  <div>
                    <p className="font-black text-slate-950">
                      Paiement TEST
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Transaction simulée sans débit réel.
                    </p>
                  </div>
                </label>
              </article>
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
                <h2 className="text-2xl font-black text-slate-950">
                  Résumé de la commande
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {itemCount} cours sélectionné
                  {itemCount > 1 ? "s" : ""}
                </p>

                <div className="mt-6 space-y-5">
                  {items.map(item => <article key={item.cartItemId} className="border-b border-slate-100 pb-5">
                      <div className="flex gap-3">
                        <img src={item.image} alt={item.imageAlt || item.title} className="size-16 shrink-0 rounded-xl object-cover" />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-black text-slate-900">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs font-bold text-emerald-600">
                            {item.planType} ·{" "}
                            {item.durationMonths} mois
                          </p>

                          <p className="mt-2 font-black text-slate-950">
                            {formatPrice(item.price, item.currency)}
                          </p>
                        </div>
                      </div>
                    </article>)}
                </div>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total</span>

                    <span className="font-bold text-slate-900">
                      {formatPrice(total, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>TPS estimée</span>

                    <span>
                      {formatPrice(estimatedTps, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>TVQ estimée</span>

                    <span>
                      {formatPrice(estimatedTvq, currency)}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-5">
                    <div className="flex items-end justify-between gap-4">
                      <span className="font-black text-slate-950">
                        Total estimé
                      </span>

                      <span className="text-2xl font-black text-slate-950">
                        {formatPrice(estimatedTotal, currency)}
                      </span>
                    </div>
                  </div>
                </div>

                <button type="button" onClick={handleCheckout} disabled={processing} className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {processing ? <LoaderCircle size={20} className="animate-spin" /> : <ShieldCheck size={20} />}

                  {processing ? "Traitement du paiement..." : "Payer maintenant"}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                  En mode TEST, aucun montant réel ne sera
                  prélevé. Le backend déterminera le prix réel
                  de chaque plan.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>;
}
export default CheckoutPage;
