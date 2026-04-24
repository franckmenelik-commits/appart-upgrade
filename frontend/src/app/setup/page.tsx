"use client";

import BaselineForm, { BaselineFormData } from "@/components/BaselineForm";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"auth" | "baseline">("auth");

  // Auth form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vivenza_token");
    if (token) {
      // Si on a un token, on récupère l'utilisateur pour être sûr d'avoir l'ID
      api.me(token).then((user: any) => {
        localStorage.setItem("vivenza_user_id", user.id);
        setStep("baseline");
      }).catch(() => {
        localStorage.removeItem("vivenza_token");
        localStorage.removeItem("vivenza_user_id");
      });
    }
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = isLogin
        ? (await api.login(email, password)) as { token: string; user: { id: string } }
        : (await api.register(email, name, password)) as { token: string; user: { id: string } };

      localStorage.setItem("vivenza_token", result.token);
      localStorage.setItem("vivenza_user_id", result.user.id);
      setStep("baseline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleBaseline = async (data: BaselineFormData) => {
    setError(null);
    setLoading(true);

    try {
      const userId = localStorage.getItem("vivenza_user_id");
      if (!userId) throw new Error("Pas connecte");

      await api.createBaseline(userId, data as unknown as Record<string, unknown>);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.message.includes("404") || err.message.includes("not found")) {
        // Stale session from old server! Clear and restart
        localStorage.removeItem("vivenza_token");
        localStorage.removeItem("vivenza_user_id");
        setStep("auth");
        setError("Ta session a expire (migration serveur). Re-inscris-toi en 10s.");
      } else {
        setError(err instanceof Error ? err.message : "Erreur de sauvegarde");
      }
    } finally {
      setLoading(false);
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

      <div className="max-w-lg mx-auto px-6 py-12">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 text-sm">
            {error}
          </div>
        )}

        {step === "auth" ? (
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {isLogin ? "Content de te revoir" : "Cree ton compte"}
            </h1>
            <p className="text-[var(--muted)] mb-8">
              {isLogin ? "Connecte-toi pour acceder a ton dashboard." : "En 30 secondes, tu es pret a trouver ton upgrade."}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-1">Prenom</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
                    placeholder="Franck"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
                  placeholder="franck@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-3 py-2.5"
                  placeholder="Minimum 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "..." : isLogin ? "Se connecter" : "Creer mon compte"}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--muted)] mt-6">
              {isLogin ? "Pas encore de compte?" : "Deja un compte?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 font-medium hover:underline"
              >
                {isLogin ? "Creer un compte" : "Se connecter"}
              </button>
            </p>
          </div>
        ) : (
          <BaselineForm onSubmit={handleBaseline} />
        )}
      </div>
    </div>
  );
}
