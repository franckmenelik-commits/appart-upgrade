import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <span className="text-xl font-bold tracking-tight">Vivenza</span>
          <span className="ml-4 text-[8px] bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">LIVE UPDATE 18h15</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            Tarifs
          </Link>
          <Link href="/setup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Commencer
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-sm font-medium">
          Nouveau à Montréal
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Trouve ton signal
          <br />
          <span className="text-blue-600">dans le bruit du marché</span>
        </h1>

        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto mb-10">
          Vivenza analyse les annonces d&apos;appartements en temps réel et te dit
          exactement ce que tu gagnes par rapport à ton logement actuel.
          Un score de 0 à 100. Pas de bullshit.
        </p>

        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-xl bg-blue-600 animate-[pulse-ring_2.5s_ease-out_infinite] opacity-0" />
          <Link
            href="/setup"
            className="relative inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all btn-shine"
          >
            Définir mon baseline
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-40 grayscale contrast-125">
          <span className="text-sm font-bold uppercase tracking-widest italic">Radio-Canada</span>
          <span className="text-sm font-bold uppercase tracking-widest italic">Cult MTL</span>
          <span className="text-sm font-bold uppercase tracking-widest italic">Narcity</span>
          <span className="text-sm font-bold uppercase tracking-widest italic">La Presse</span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-y border-[var(--card-border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap justify-center md:justify-between gap-8 text-center md:text-left">
          <div>
            <div className="text-2xl font-bold">1,248</div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Annonces analysées / 24h</div>
          </div>
          <div>
            <div className="text-2xl font-bold">150$</div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Économie moy. par mois</div>
          </div>
          <div>
            <div className="text-2xl font-bold">+210 sqft</div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Gain de place moyen</div>
          </div>
          <div>
            <div className="text-2xl font-bold">94%</div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Satisfaction utilisateurs</div>
          </div>
        </div>
      </div>

      {/* Comparison Mockup */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Pourquoi un score ?</h2>
          <p className="text-[var(--muted)]">On compare tout ce qui compte : loyer, surface, distance métro, lave-vaisselle, et plus.</p>
        </div>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--card-border)] bg-[var(--surface)]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center text-xs text-[var(--muted)]">vivenza.app/dashboard</div>
          </div>
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {[
              { 
                score: 87, 
                color: "#16a34a", 
                title: "4 1/2 lumineux — Plateau", 
                price: "+120$", 
                sqft: "+180 sqft", 
                img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60",
                badge: "L'Upgrade Parfait"
              },
              { 
                score: 42, 
                color: "#ca8a04", 
                title: "Studio moderne — Griffintown", 
                price: "+350$", 
                sqft: "-80 sqft", 
                img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=60",
                badge: "Trop cher pour ce que c'est"
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl overflow-hidden border border-[var(--card-border)] hover:shadow-md transition-shadow">
                <div className="relative h-48 bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur rounded text-[10px] font-bold uppercase tracking-wide">
                    {item.badge}
                  </div>
                  <div
                    className="absolute top-3 left-3 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.score}
                  </div>
                </div>
                <div className="p-4 bg-[var(--card)]">
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <span className={item.price.startsWith("+") && parseInt(item.price) > 200 ? "text-red-500" : "text-green-600"}>{item.price}/mois</span>
                    <span className={item.sqft.startsWith("+") ? "text-green-600" : "text-red-500"}>{item.sqft}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12 uppercase tracking-tight">Le processus</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Décris ta baseline", desc: "Ton loyer et tes critères actuels. C'est le point zéro." },
            { step: "02", title: "IA Monitoring", desc: "Scraping en temps réel de Centris, Marketplace et Kijiji." },
            { step: "03", title: "Score Actionnable", desc: "Arrivée d'un score 70+ ? Foncez, c'est une affaire en or." },
          ].map((item) => (
            <div key={item.step} className="p-6 rounded-2xl border border-[var(--card-border)] hover:bg-white transition-colors">
              <div className="text-4xl font-black text-blue-600/10 mb-4">{item.step}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-[var(--surface)] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Ils ont trouvé leur upgrade</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Marc-Antoine", role: "Plateau Mont-Royal", quote: "J'hésitais à quitter mon 3 1/2. Vivenza m'a montré un 92/100. J'ai gagné 200 sqft pour 50$ de plus." },
              { name: "Sonia L.", role: "Étudiante", quote: "L'extension Chrome sur Marketplace m'a sauvé de 3 scams évidents. Le score ne ment pas." },
              { name: "Jean-Phil", role: "Professionnel", quote: "Rentabilisé en un mois. Les alertes email m'ont permis d'être le premier à visiter." },
            ].map((t) => (
              <div key={t.name} className="relative bg-[var(--card)] p-8 rounded-3xl border border-[var(--card-border)] shadow-sm">
                <div className="flex text-yellow-400 mb-4 space-x-1">
                  {"★".split("").map((s, i) => <span key={i}>★</span>)}
                </div>
                <p className="text-sm italic mb-6 leading-relaxed">&quot;{t.quote}&quot;</p>
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-[var(--muted)]">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-blue-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-transparent opacity-50" />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Prêt à trouver votre upgrade ?</h2>
          <p className="text-blue-100 mb-10 text-lg opacity-80 font-medium">5 scores offerts. Setup en 2 minutes.</p>
          <Link
            href="/setup"
            className="inline-block bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl"
          >
            Démarrer gratuitement
          </Link>
        </div>
      </div>

      {/* Legal Footer */}
      <footer className="bg-[var(--background)] py-12 border-t border-[var(--card-border)]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">V</div>
            <span className="text-sm font-bold">Vivenza © 2026</span>
          </div>
          <div className="flex gap-8 text-xs text-[var(--muted)]">
            <Link href="/terms" className="hover:text-blue-600">Conditions</Link>
            <Link href="/privacy" className="hover:text-blue-600">Confidentialité</Link>
            <Link href="/contact" className="hover:text-blue-600">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
