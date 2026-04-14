"use client";

import { api } from "@/lib/api";
import Link from "next/link";

const PLANS = [
  {
    id: "free",
    name: "Gratuit",
    price: "0",
    period: "",
    description: "Pour tester le concept",
    features: [
      "5 scores par mois",
      "Entree manuelle d'annonces",
      "Score d'upgrade de base",
    ],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "4,99",
    period: "",
    description: "Paiement unique · Accès à vie",
    features: [
      "Scores illimites",
      "Scraping Centris automatique",
      "Extension Chrome Marketplace",
      "Notifications email (score 70+)",
      "Historique complet",
    ],
    cta: "Débloquer les annonces",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "19.99",
    period: "/mois",
    description: "L'avantage decisif",
    features: [
      "Tout Pro inclus",
      "Analyse d'images par IA",
      "Calcul de trajet Google Maps",
      "Alertes push temps reel",
      "Acces API",
      "Support prioritaire",
    ],
    cta: "Passer a Premium",
    highlighted: false,
  },
];

export default function PricingPage() {
  const handleCheckout = async (planId: string) => {
    if (planId === "free") {
      window.location.href = "/setup";
      return;
    }
    const token = localStorage.getItem("vivenza_token");
    if (!token) {
      window.location.href = `/setup?next=pricing`;
      return;
    }
    try {
      const result = (await api.createCheckout(token, planId)) as { checkout_url: string };
      window.location.href = result.checkout_url;
    } catch {
      window.location.href = "/setup";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">V</div>
          <span className="text-xl font-bold tracking-tight">Vivenza</span>
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl md:text-4xl font-bold">Un plan simple pour chaque etape</h1>
          <p className="text-[var(--muted)] mt-3 text-lg">
            Commence gratuitement, upgrade quand t&apos;es pret.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-px ${
                plan.highlighted ? "conic-border" : ""
              }`}
            >
              <div className={`rounded-2xl p-6 h-full ${
                plan.highlighted
                  ? "bg-[var(--card)] shadow-xl"
                  : "bg-[var(--card)] border border-[var(--card-border)]"
              }`}>
                {plan.highlighted && (
                  <div className="inline-block mb-3 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 text-xs font-bold uppercase tracking-wide">
                    Populaire
                  </div>
                )}

                <h2 className="text-xl font-bold">{plan.name}</h2>
                <p className="text-sm text-[var(--muted)] mt-1">{plan.description}</p>

                <div className="mt-5 mb-6">
                  <span className="text-4xl font-bold">{plan.price}$</span>
                  <span className="text-[var(--muted)] text-sm">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                    plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700 btn-shine"
                      : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[var(--muted)] mt-10">
          Tous les prix sont en dollars canadiens. Accès à vie après un seul paiement.
        </p>
      </div>
    </div>
  );
}
