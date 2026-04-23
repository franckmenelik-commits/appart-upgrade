"use client";

import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManualAddPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "scoring" | "done">("form");
  
  const [form, setForm] = useState({
    url: "",
    source: "marketplace",
    title: "",
    address: "",
    rent_monthly: "",
    description_raw: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("vivenza_token");
      if (!token) throw new Error("Non connecté");

      // 1. Create Listing
      const listingData = {
        url: form.url,
        source: form.source,
        title: form.title,
        address: form.address,
        rent_monthly: Number(form.rent_monthly) || 0,
        description_raw: form.description_raw,
        city: "Montréal", // Par défaut pour le MVP
        is_active: true
      };

      const listing = await api.createListing(listingData) as { id: string };
      
      setStep("scoring");

      // 2. Score Listing
      await api.scoreListing(token, listing.id);

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
      setLoading(false);
      setStep("form");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="border-b border-[var(--card-border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[var(--muted)] hover:text-blue-600 transition-colors">&larr; Retour</span>
          </Link>
          <span className="text-lg font-bold">Ajout manuel</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Ajouter une annonce</h1>
        <p className="text-[var(--muted)] mb-8">
          Colle les infos d&apos;une annonce Facebook Marketplace ou Kijiji. Notre IA va l&apos;analyser et lui donner un score.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 text-sm">
            {error}
          </div>
        )}

        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <select 
                value={form.source}
                onChange={e => setForm({...form, source: e.target.value})}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
              >
                <option value="marketplace">Facebook Marketplace</option>
                <option value="kijiji">Kijiji</option>
                <option value="centris">Centris</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL de l&apos;annonce (optionnel)</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm({...form, url: e.target.value})}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Titre de l&apos;annonce</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
                placeholder="Ex: 4 1/2 lumineux sur le Plateau"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loyer ($)</label>
                <input
                  type="number"
                  value={form.rent_monthly}
                  onChange={e => setForm({...form, rent_monthly: e.target.value})}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
                  placeholder="1200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse ou Quartier</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
                  placeholder="Plateau Mont-Royal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (Copie-colle le texte)</label>
              <textarea
                value={form.description_raw}
                onChange={e => setForm({...form, description_raw: e.target.value})}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5 min-h-[120px]"
                placeholder="Copie-colle la description complète de l'annonce ici pour que l'IA puisse en extraire les détails (surface, équipements, etc.)"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : "Analyser cette annonce"}
            </button>
          </form>
        )}

        {step === "scoring" && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">L&apos;IA analyse ton annonce</h2>
            <p className="text-[var(--muted)]">Calcul du score, vérification du trajet et extraction des équipements...</p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✨</div>
            <h2 className="text-xl font-bold mb-2 text-green-600">Score calculé avec succès !</h2>
            <p className="text-[var(--muted)]">Retour au dashboard en cours...</p>
          </div>
        )}
      </div>
    </div>
  );
}
