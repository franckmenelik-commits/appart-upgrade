"use client";

import BaselineForm, { BaselineFormData } from "@/components/BaselineForm";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseline, setBaseline] = useState<BaselineFormData | null>(null);

  useEffect(() => {
    const fetchBaseline = async () => {
      const userId = localStorage.getItem("vivenza_user_id");
      if (!userId) {
        window.location.href = "/setup";
        return;
      }
      try {
        const data = await api.getBaseline(userId) as BaselineFormData;
        setBaseline(data);
      } catch (err) {
        setError("Impossible de charger ton baseline.");
      } finally {
        setLoading(false);
      }
    };

    fetchBaseline();
  }, []);

  const handleUpdate = async (data: BaselineFormData) => {
    setError(null);
    setSuccess(null);
    
    try {
      const userId = localStorage.getItem("vivenza_user_id");
      if (!userId) throw new Error("Non connecté");

      try {
        // Try to update first
        await api.updateBaseline(userId, data as unknown as Record<string, unknown>);
      } catch (err: any) {
        // If update fails because it doesn't exist (404), create it
        if (err.message.includes("404") || err.message.includes("Not Found")) {
          await api.createBaseline(userId, data as unknown as Record<string, unknown>);
        } else {
          throw err;
        }
      }
      
      setSuccess("Baseline sauvegardé avec succès !");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de mise à jour");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="border-b border-[var(--card-border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[var(--muted)] hover:text-blue-600 transition-colors">&larr; Retour</span>
          </Link>
          <span className="text-lg font-bold">Paramètres</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Modifier mon Baseline</h1>
        <p className="text-[var(--muted)] mb-8">
          Mets à jour tes critères si tes besoins ont changé. Les futurs scores en tiendront compte.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 text-sm font-medium">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-[var(--muted)]">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            Chargement de tes données...
          </div>
        ) : (
          <BaselineForm 
            initialData={baseline || undefined} 
            onSubmit={handleUpdate} 
            submitText={baseline ? "Mettre à jour" : "Créer mon profil"} 
          />
        )}
      </div>
    </div>
  );
}
