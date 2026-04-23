import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="max-w-6xl mx-auto px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">V</div>
          <span className="text-sm font-bold tracking-tight">Vivenza</span>
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">On vous écoute</h1>
        <p className="text-[var(--muted)] mb-10">Un bug ? Une suggestion ? Une question sur votre abonnement ?</p>
        
        <div className="bg-[var(--card)] p-8 rounded-3xl border border-[var(--card-border)] shadow-sm">
          <div className="text-lg font-bold mb-1">Email</div>
          <a href="mailto:hello@vivenza.ca" className="text-blue-600 hover:underline">hello@vivenza.ca</a>
          
          <div className="mt-8 pt-8 border-t border-[var(--card-border)] text-xs text-[var(--muted)]">
            Réponse généralement sous 24h (EST). 🇨🇦
          </div>
        </div>
      </div>
    </div>
  );
}
