"use client";

import ScoreCard from "@/components/ScoreCard";
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UpgradeScore } from "@/types";

// Plans gratuit : 5 scores visibles — les autres sont floutés
const FREE_VISIBLE_COUNT = 5;

function BlurredCard({ score, onUnlock }: { score: UpgradeScore; onUnlock: () => void }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-[var(--card-border)]">
      {/* Card flouttée */}
      <div className="blur-sm pointer-events-none select-none">
        <ScoreCard score={score} />
      </div>

      {/* Overlay de déblocage */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-[2px]">
        <div className="text-center px-6">
          <div className="text-3xl mb-2">🔒</div>
          <div className="font-bold text-lg mb-1">
            Score : <span className="text-blue-600">{score.total_score}/100</span>
          </div>
          <p className="text-sm text-[var(--muted)] mb-4">
            Passe à Pro pour voir cette annonce et toutes les autres.
          </p>
          <button
            onClick={onUnlock}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Débloquer — 4,99$ (accès à vie)
          </button>
        </div>
      </div>
    </div>
  );
}

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

    (async () => {
      try {
        const me = (await api.me(token)) as { name: string; plan: string; scores_used_this_month: number };
        setUser(me);
        const userScores = (await api.getUserScores(token, minScore)) as UpgradeScore[];
        setScores(userScores);
      } catch {
        localStorage.removeItem("vivenza_token");
        window.location.href = "/setup";
      } finally {
        setLoading(false);
      }
    })();
  }, [minScore]);

  const handleUnlock = () => {
    window.location.href = "/pricing";
  };

  const filteredScores = source ? scores.filter((s) => s.listing.source === source) : scores;
  const isFree = user?.plan === "free";
  const visibleScores = isFree ? filteredScores.slice(0, FREE_VISIBLE_COUNT) : filteredScores;
  const lockedScores = isFree ? filteredScores.slice(FREE_VISIBLE_COUNT) : [];

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
              {isFree && filteredScores.length > FREE_VISIBLE_COUNT && (
                <span className="text-amber-600 font-medium text-xs bg-amber-50 px-2 py-1 rounded-full">
                  {lockedScores.length} résultats verrouillés
                </span>
              )}
              {isFree && (
                <Link href="/pricing" className="text-blue-600 font-medium hover:underline">
                  Débloquer — 4,99$
                </Link>
              )}
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
              {filteredScores.length} annonces analysées
              {isFree && lockedScores.length > 0 && (
                <span className="text-amber-600 ml-2">· {lockedScores.length} verrouillées</span>
              )}
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

        {loading ? (
          <div className="text-center py-20 text-[var(--muted)]">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Chargement...
          </div>
        ) : filteredScores.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold mb-2">Aucune recommandation encore</h2>
            <p className="text-[var(--muted)] mb-6 max-w-md mx-auto text-sm">
              Les annonces sont scrapées automatiquement toutes les 3 heures.
              Utilise aussi l&apos;extension Chrome sur Marketplace pour ajouter des annonces manuellement.
            </p>
            <Link href="/setup" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Vérifier mon baseline
            </Link>
          </div>
        ) : (
          <>
            {/* Scores visibles */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleScores.map((score) => (
                <ScoreCard key={score.id} score={score} />
              ))}
            </div>

            {/* Scores verrouillés */}
            {lockedScores.length > 0 && (
              <>
                <div className="my-8 flex items-center gap-4">
                  <div className="flex-1 border-t border-[var(--card-border)]" />
                  <div className="text-sm font-medium text-[var(--muted)] flex items-center gap-2">
                    🔒 {lockedScores.length} annonce{lockedScores.length > 1 ? "s" : ""} verrouillée{lockedScores.length > 1 ? "s" : ""}
                  </div>
                  <div className="flex-1 border-t border-[var(--card-border)]" />
                </div>

                {/* Bannière upgrade */}
                <div className="mb-6 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      {lockedScores.length} résultats te sont cachés
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Le meilleur upgrade pourrait être parmi eux. Passe à Pro pour tout voir.
                    </p>
                  </div>
                  <Link
                    href="/pricing"
                    className="shrink-0 ml-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
                  >
                    Débloquer tout — 4,99$ (une fois)
                  </Link>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {lockedScores.map((score) => (
                    <BlurredCard key={score.id} score={score} onUnlock={handleUnlock} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
