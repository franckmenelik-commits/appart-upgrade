"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("vivenza_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("vivenza_consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-sm bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="text-sm font-semibold mb-2">Rester en règle ⚖️</div>
      <p className="text-xs text-[var(--muted)] mb-4 leading-relaxed">
        En continuant, vous acceptez nos <Link href="/terms" className="underline hover:text-blue-600">Conditions</Link> et notre <Link href="/privacy" className="underline hover:text-blue-600">Politique de Confidentialité</Link> (Loi 25 / RGPD).
      </p>
      <button 
        onClick={accept}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
      >
        J&apos;ai compris
      </button>
    </div>
  );
}
