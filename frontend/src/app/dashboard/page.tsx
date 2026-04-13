"use client";

import ScoreCard from "@/components/ScoreCard";
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UpgradeScore } from "@/types";

export default function DashboardPage() {
  const [scores, setScores] = useState<UpgradeScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; plan: string; scores_used_this_month: number } | null>(null);
  const [source, setSource] = useState("");
  const [minScore, setMinScore] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("vivenza_token");
    if (!token) {
      window.location.href = "/setup";
      return;
    }

    // Load user profile + scores
    (async () => {
      try {
        const me = (await api.me(token)) as { name: string; plan: string; scores_used_this_month: number };
        setUser(me);

        const userScores = (await api.getUserScores(token, minScore)) as UpgradeScore[];
        setScores(userScores);
      } catch {
        // Token expired or invalid
        localStorage.removeItem("vivenza_token");
        window.location.href = "/setup";
      } finally {
        setLoading(false);
      }
    })();
  }, [minScore]);

  const filteredScores = source
    ? scores.filter((s) => s.listing.source === source)
    : scores;

  const isEmpty = !loading && filteredScores.length === 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="border-b border-[var(--card-border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">V</div>
            <span className="text-lg font-bold">Vivenza</span>
          </Link>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[var(--muted)]">
                Plan: <span className="text-[var(--foreground)] font-medium capitalize">{user.plan}</span>
              </span>
              {user.plan === "free" && (
                <span className="text-[var(--muted)]">
                  Scores: <span className="text-[var(--foreground)] font-medium">{user.scores_used_this_month}/5</span>
                </span>
              )}
              <Link href="/pricing" className="text-blue-600 font-medium hover:underline">
                Upgrade
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {user ? `Salut ${user.name.split(" ")[0]}` : "Tes recommandations"}
            </h1>
            <p className="text-[var(--muted)] text-sm mt-1">
              {filteredScores.length} annonces analysees
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm"
            >
              <option value="">Toutes les sources</option>
              <option value="centris">Centris</option>
              <option value="marketplace">Marketplace</option>
              <option value="kijiji">Kijiji</option>
            </select>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-sm"
            >
              <option value={0}>Score 0+</option>
              <option value={50}>Score 50+</option>
              <option value={70}>Score 70+</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-[var(--muted)]">Chargement...</div>
        ) : isEmpty ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold mb-2">Aucune recommandation encore</h2>
            <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
              Les annonces sont scrapees automatiquement toutes les 6 heures.
              Tu peux aussi ajouter des annonces manuellement ou utiliser l&apos;extension Chrome sur Marketplace.
            </p>
            <Link
              href="/setup"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Verifier mon baseline
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredScores.map((score) => (
              <ScoreCard key={score.id} score={score} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
