"use client";

import ScoreCard from "@/components/ScoreCard";
import { api } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UpgradeScore } from "@/types";

const FREE_VISIBLE_COUNT = 5;

function BlurredCard({ score, onUnlock }: { score: UpgradeScore; onUnlock: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-[var(--card-border)] bg-[var(--card)] shadow-sm">
      <div className="blur-md pointer-events-none select-none grayscale opacity-50">
        <ScoreCard score={score} />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-[4px]">
        <div className="text-center p-6 bg-white/90 dark:bg-black/90 rounded-2xl shadow-2xl border border-white/20 max-w-[80%]">
          <div className="text-3xl mb-3">💎</div>
          <div className="font-bold text-lg mb-1">
            Recommandation <span className="text-blue-600">Premium</span>
          </div>
          <p className="text-xs text-[var(--muted)] mb-5">
            Ce score de <span className="font-bold text-[var(--foreground)]">{score.total_score}/100</span> indique un potentiel élevé.
          </p>
          <button
            onClick={onUnlock}
            className="w-full bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg hover:scale-105"
          >
            Débloquer pour 4,99$
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

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.total_score, 0) / scores.length) : 0;
  const topMatch = scores.length > 0 ? Math.max(...scores.map(s => s.total_score)) : 0;

  return (
    <div className="min-h-screen bg-[#fcfcfb] dark:bg-[#0c0a09] flex flex-col">
      {/* Premium Navigation */}
      <nav className="sticky top-0 z-40 border-b border-[var(--card-border)] bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-blue-200 shadow-lg">V</div>
            <span className="text-xl font-black tracking-tighter">VIVENZA</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              <Link href="/dashboard" className="text-blue-600">Analyses</Link>
              <Link href="/manual" className="hover:text-blue-600">Ajouter</Link>
              <Link href="/settings" className="hover:text-blue-600">Profil</Link>
            </div>
            <div className="h-6 w-px bg-[var(--card-border)]" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end mr-1">
                <span className="text-xs font-bold truncate max-w-[100px]">{user?.name || "Utilisateur"}</span>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">{user?.plan}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 border border-[var(--card-border)] flex items-center justify-center font-bold text-blue-600">
                {user?.name?.[0] || "U"}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex max-w-[1400px] mx-auto w-full">
        {/* Sidebar Mini Filters */}
        <aside className="hidden lg:block w-72 border-r border-[var(--card-border)] p-8 sticky top-[73px] h-[calc(100vh-73px)]">
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-4">Filtrer par source</h3>
              <div className="space-y-2">
                {["", "centris", "kijiji", "marketplace"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                      source === s ? "bg-blue-600 text-white shadow-lg" : "hover:bg-[var(--surface)] text-[var(--muted)]"
                    }`}
                  >
                    <span className="capitalize">{s || "Toutes"}</span>
                    <span className="text-[10px] opacity-60">
                      {s ? scores.filter(x => x.listing.source === s).length : scores.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-4">Exigence minimale</h3>
              <div className="space-y-1">
                {[0, 50, 70, 85].map((s) => (
                  <button
                    key={s}
                    onClick={() => setMinScore(s)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      minScore === s ? "text-blue-600 font-bold" : "text-[var(--muted)] hover:bg-[var(--surface)]"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${s >= 70 ? "bg-green-500" : s >= 50 ? "bg-yellow-500" : "bg-blue-300"}`} />
                    Score {s}+
                  </button>
                ))}
              </div>
            </div>

            {isFree && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl">
                <div className="text-xl mb-2 font-bold leading-tight">Gagne 48h sur le marché.</div>
                <p className="text-blue-100 text-xs mb-4 leading-relaxed opacity-90">
                  Débloque tous les scores et reçois des alertes email instantanées.
                </p>
                <Link href="/pricing" className="block text-center py-2 bg-white text-blue-600 rounded-xl text-xs font-bold hover:scale-105 transition-transform">
                  Upgrade Pro
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-10">
          {/* Stats Glance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-1">Annonces</div>
              <div className="text-2xl font-black">{scores.length}</div>
            </div>
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-1">Score Moyen</div>
              <div className="text-2xl font-black text-blue-600">{avgScore}%</div>
            </div>
            <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--card-border)] shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] mb-1">Meilleur Match</div>
              <div className="text-2xl font-black text-green-600">{topMatch}%</div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <div className="font-bold uppercase tracking-widest text-xs">Analyse du marché...</div>
            </div>
          ) : filteredScores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-6">🔍</div>
              <h2 className="text-2xl font-bold mb-3">Silence radio</h2>
              <p className="text-[var(--muted)] text-sm mb-8">
                On scrute Montréal en continu. Dés que l&apos;algorithme détecte un upgrade par rapport à ton logement actuel, il apparaîtra ici.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Link href="/manual" className="bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100">+ Ajouter manuellement</Link>
                <Link href="/settings" className="text-sm font-bold text-blue-600">Ajuster mes critères</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Grille principale */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--muted)] mb-6 flex items-center gap-3">
                  <div className="w-10 h-px bg-[var(--card-border)]" />
                  Analyses Prioritaires
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {visibleScores.map((score) => (
                    <ScoreCard key={score.id} score={score} />
                  ))}
                </div>
              </div>

              {/* Section Verrouillée */}
              {isFree && lockedScores.length > 0 && (
                <div className="pt-8 border-t-2 border-dashed border-[var(--card-border)]">
                  <div className="mb-8 flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
                      🔒 Résultats Premium ({lockedScores.length})
                    </h2>
                    <Link href="/pricing" className="text-xs font-bold text-blue-600 underline">Tout débloquer</Link>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lockedScores.map((score) => (
                      <BlurredCard key={score.id} score={score} onUnlock={handleUnlock} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
