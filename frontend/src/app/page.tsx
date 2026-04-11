import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Appart<span className="text-blue-600">Upgrade</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Trouve ton prochain appart en sachant exactement ce que tu gagnes
            par rapport a ton logement actuel.
          </p>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">1</div>
            <h3 className="font-semibold text-lg mb-2">Ton baseline</h3>
            <p className="text-gray-600 text-sm">
              Decris ton appart actuel : loyer, surface, equipements, trajet.
              C&apos;est ton point de reference.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">2</div>
            <h3 className="font-semibold text-lg mb-2">On scrape pour toi</h3>
            <p className="text-gray-600 text-sm">
              On surveille Kijiji, Zumper, Centris et plus en temps reel.
              Chaque annonce est analysee par l&apos;IA.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="text-3xl mb-3">3</div>
            <h3 className="font-semibold text-lg mb-2">Score d&apos;upgrade</h3>
            <p className="text-gray-600 text-sm">
              Chaque annonce recoit un score 0-100 : tu sais immediatement si
              c&apos;est un upgrade reel ou pas.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/setup"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Commencer - Definir mon baseline
          </Link>
        </div>
      </div>
    </div>
  );
}
