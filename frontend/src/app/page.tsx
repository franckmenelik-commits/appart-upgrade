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
          Nouveau a Montreal
        </div>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Trouve ton signal
          <br />
          <span className="text-blue-600">dans le bruit du marche</span>
        </h1>

        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto mb-10">
          Vivenza analyse les annonces d&apos;appartements en temps reel et te dit
          exactement ce que tu gagnes par rapport a ton logement actuel.
          Un score de 0 a 100. Pas de bullshit.
        </p>

        {/* CTA with pulse ring */}
        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-xl bg-blue-600 animate-[pulse-ring_2.5s_ease-out_infinite] opacity-0" />
          <div className="absolute inset-0 rounded-xl bg-blue-600 animate-[pulse-ring_2.5s_ease-out_1.25s_infinite] opacity-0" />
          <Link
            href="/setup"
            className="relative inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all btn-shine"
          >
            Definir mon baseline
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <p className="mt-4 text-sm text-[var(--muted)]">
          Gratuit pour 5 scores. Aucune carte requise.
        </p>
      </div>

      {/* Score preview mockup */}
      <div className="max-w-4xl mx-auto px-6 mb-20">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl overflow-hidden">
          {/* Fake browser bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--card-border)] bg-[var(--surface)]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center text-xs text-[var(--muted)]">vivenza.app/dashboard</div>
          </div>
          {/* Mock score cards */}
          <div className="p-6 grid md:grid-cols-2 gap-4">
            {[
              { score: 87, color: "#16a34a", title: "4 1/2 lumineux — Plateau", price: "+120$", sqft: "+180 sqft", img: "https://mspublic.centris.ca/media.ashx?id=ADDD250DE74EA3BDDDDDDDDDDB&t=pi&w=320&h=240&sm=c" },
              { score: 42, color: "#ca8a04", title: "Studio moderne — Griffintown", price: "+350$", sqft: "-80 sqft", img: "https://mspublic.centris.ca/media.ashx?id=ADDD250DE392D83DDDDDDDDDDA&t=pi&w=320&h=240&sm=c" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl overflow-hidden border border-[var(--card-border)]">
                <div className="relative h-40 bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  <div
                    className="absolute top-3 left-3 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.score}
                  </div>
                </div>
                <div className="p-4">
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
        <h2 className="text-3xl font-bold text-center mb-12">Comment ca marche</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Decris ton nid actuel", desc: "Ton loyer, ta surface, tes equipements, ton trajet. C'est ta reference." },
            { step: "02", title: "On surveille pour toi", desc: "Centris, Marketplace, Kijiji — scrapees en temps reel, analysees par l'IA." },
            { step: "03", title: "Score d'upgrade", desc: "Chaque annonce recoit un score 0-100. Tu sais en un coup d'oeil si ca vaut le coup." },
          ].map((item) => (
            <div key={item.step} className="relative">
              <div className="text-5xl font-black text-blue-100 dark:text-blue-950 mb-2">{item.step}</div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="border-t border-[var(--card-border)] bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Pret a trouver ton upgrade?</h2>
          <p className="text-[var(--muted)] mb-6">5 scores gratuits. Setup en 2 minutes.</p>
          <Link
            href="/setup"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Commencer maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}
