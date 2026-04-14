"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const plan = params.get("plan") || "pro";

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">
          Bienvenue sur Vivenza {plan === "premium" ? "Premium" : "Pro"} !
        </h1>
        <p className="text-[var(--muted)] mb-8">
          {plan === "premium"
            ? "Tu as maintenant accès aux alertes temps réel, à l'analyse d'images et à l'API. Les annonces seront scorées toutes les 3 heures."
            : "Tu as maintenant accès aux scores illimités, au scraping automatique et aux alertes email. Ton dashboard se met à jour toutes les 3 heures."}
        </p>

        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Voir mon dashboard →
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
