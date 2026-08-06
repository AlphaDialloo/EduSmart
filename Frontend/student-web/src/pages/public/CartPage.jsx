import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";

import { useCart } from "../../contexts/CartContext";

function formatPrice(price, currency = "CAD") {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
  }).format(Number(price || 0));
}

function CartPage() {
  const {
    items,
    itemCount,
    total,
    removeFromCart,
    clearCart,
  } = useCart();

  const currency = items[0]?.currency || "CAD";

  if (itemCount === 0) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <ShoppingBag
            size={50}
            className="mx-auto text-indigo-600"
          />

          <h1 className="mt-5 text-3xl font-black text-slate-950">
            Votre panier est vide
          </h1>

          <p className="mt-3 text-slate-500">
            Explorez le catalogue et choisissez un plan de cours.
          </p>

          <Link
            to="/courses"
            className="mt-7 inline-flex rounded-2xl bg-indigo-600 px-6 py-4 font-black text-white"
          >
            Explorer les cours
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600"
          >
            <ArrowLeft size={17} />
            Continuer mes achats
          </Link>

          <h1 className="mt-4 text-4xl font-black text-slate-950">
            Votre panier
          </h1>

          <p className="mt-2 text-slate-500">
            {itemCount} cours sélectionné
            {itemCount > 1 ? "s" : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"
        >
          Vider le panier
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          {items.map((item) => (
            <article
              key={item.cartItemId}
              className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row"
            >
              <img
                src={item.image}
                alt={item.imageAlt || item.title}
                className="h-40 w-full rounded-2xl object-cover sm:w-56"
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wide text-indigo-600">
                  {item.category}
                </p>

                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {item.title}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Par {item.instructor}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                    {item.planType}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                    {item.durationMonths} mois
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-xl font-black text-slate-950">
                    {formatPrice(item.price, item.currency)}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.courseId)
                    }
                    className="inline-flex items-center gap-2 text-sm font-bold text-red-600"
                  >
                    <Trash2 size={17} />
                    Retirer
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-black text-slate-950">
              Résumé
            </h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Sous-total</span>
                <span>{formatPrice(total, currency)}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-600">
                <span>Taxes</span>
                <span>Calculées au paiement</span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span className="font-black text-slate-950">
                    Total
                  </span>

                  <span className="text-2xl font-black text-slate-950">
                    {formatPrice(total, currency)}
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center rounded-2xl bg-indigo-600 px-6 py-4 font-black text-white"
            >
              Continuer vers le paiement
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default CartPage;