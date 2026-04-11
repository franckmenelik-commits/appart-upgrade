"use client";

import { api } from "@/lib/api";

const PLANS = [
  {
    id: "free",
    name: "Gratuit",
    price: "0$",
    period: "",
    description: "Pour tester le concept",
    features: ["5 scores/mois", "Entree manuelle d'annonces", "Score d'upgrade de base"],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "9.99$",
    period: "/mois",
    description: "Pour chercher serieusement",
    features: [
      "Scores illimites",
      "Scraping Centris automatique",
      "Extension Chrome Marketplace",
      "Notifications email (score 70+)",
      "Historique complet",
    ],
    cta: "Passer a Pro",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "19.99$",
    period: "/mois",
    description: "L'avantage decisif",
    features: [
      "Tout Pro +",
      "Analyse d'images par IA",
      "Calcul de trajet Google Maps",
      "Alertes push temps reel (score 80+)",
      "Acces API",
      "Support prioritaire",
    ],
    cta: "Passer a Premium",
    highlighted: false,
  },
];

export default function PricingPage() {
  const handleCheckout = async (planId: string) => {
    if (planId === "free") return;
    // TODO: Remplacer par le vrai userId depuis l'auth
    const userId = "demo-user-id";
    try {
      const result = (await api.createCheckout(userId, planId)) as { checkout_url: string };
      window.location.href = result.checkout_url;
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">Choisis ton plan</h1>
          <p className="text-gray-500 mt-2">
            Commence gratuitement, upgrade quand tu es pret.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl p-6 border-2 transition-shadow ${
                plan.highlighted
                  ? "border-blue-500 shadow-lg bg-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs font-bold text-blue-600 uppercase mb-2">
                  Populaire
                </div>
              )}
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="text-gray-500 text-sm mt-1">{plan.description}</p>

              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
